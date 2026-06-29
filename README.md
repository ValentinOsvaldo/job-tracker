# Job Tracker — Especificación del Proyecto

## Resumen

Sistema personal de seguimiento de ofertas de trabajo con scraping automatizado y análisis de compatibilidad con IA. Diseñado para dos usuarios (Osvaldo y Guillermo) que comparten el sistema pero tienen perfiles de búsqueda independientes por rol (frontend, backend, fullstack, mobile). La IA evalúa cada oferta contra el perfil específico activo, extrae salario y prestaciones del texto, y presenta un top 5 de las mejores oportunidades por perfil.

---

## Objetivos

- Scraping automático de ofertas de LinkedIn e Indeed sin intervención manual
- Perfiles de búsqueda múltiples y simultáneos por usuario (frontend, backend, fullstack, mobile)
- Análisis de fit por perfil activo — la IA evalúa enfocándose en el rol, no en el CV completo
- Extracción automática de salario y prestaciones del texto de la oferta (inferidos cuando no son explícitos)
- Top 5 de mejores ofertas por perfil en el dashboard
- Dashboard web para comparar scores entre perfiles y usuarios
- Base para una futura fase de aplicación y seguimiento de correos

---

## Stack técnico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Scraper | Python + FastAPI + Jobspy + APScheduler | Jobspy es la librería más madura para esto; se expone como microservicio mínimo |
| Backend | NestJS + TypeORM + PostgreSQL | Stack conocido, tipado, estructurado por módulos |
| IA | Groq API (`llama-3.3-70b`) | Gratuita, 14,400 req/día, compatible con SDK de OpenAI, latencia muy baja |
| Frontend | Nuxt 3 + Vue 3 + TanStack Query + Pinia | Stack conocido, SSR opcional, excelente DX |
| PDF parsing | `pdf-parse` (Node) | Extrae texto de CVs al momento de subir; texto se guarda en DB |

---

## Arquitectura

```
┌─────────────────────┐        ┌──────────────────────────────────────┐
│  Microservicio       │        │            NestJS Backend            │
│  Python (FastAPI)    │──────▶ │                                      │
│                      │  HTTP  │  ┌──────────┐  ┌──────────────────┐ │
│  - Jobspy scraping   │        │  │  /jobs   │  │  /users          │ │
│  - APScheduler cron  │◀────── │  │  ingest  │  │  CV upload       │ │
│  - POST /scrape      │ trigger│  └──────────┘  └──────────────────┘ │
└─────────────────────┘        │                                      │
                                │  ┌──────────────────────────────┐   │
                                │  │      Groq Service            │   │
                                │  │  analiza oferta × usuario    │   │
                                │  └──────────────────────────────┘   │
                                │              │                       │
                                │  ┌───────────▼──────────────────┐   │
                                │  │        PostgreSQL             │   │
                                │  │  users · jobs · analyses     │   │
                                │  └──────────────────────────────┘   │
                                └──────────────┬───────────────────────┘
                                               │ REST API
                                               ▼
                                ┌──────────────────────────┐
                                │       Nuxt Frontend      │
                                │  dashboard · detalle     │
                                │  trigger manual scraper  │
                                └──────────────────────────┘
```

---

## Schema de base de datos

### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL
email           VARCHAR(150) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL           -- bcrypt hash
cv_text         TEXT                            -- texto extraído del PDF
cv_filename     VARCHAR(255)                    -- nombre del archivo original
cv_uploaded_at  TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### `jobs`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         VARCHAR(255) NOT NULL
company       VARCHAR(255)
location      VARCHAR(255)
description   TEXT
url           VARCHAR(500) UNIQUE        -- evita duplicados
source        VARCHAR(50)               -- 'linkedin' | 'indeed'
date_posted   DATE
scraped_at    TIMESTAMPTZ DEFAULT NOW()
```

### `search_profiles`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
name        VARCHAR(100) NOT NULL          -- "Frontend", "Backend", "Mobile"
role        VARCHAR(50)  NOT NULL          -- 'frontend' | 'backend' | 'fullstack' | 'mobile'
keywords    TEXT[]                         -- ["vue", "react", "typescript"]
locations   TEXT[]                         -- ["Mexico", "Remote"]
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### `job_analyses`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
job_id              UUID REFERENCES jobs(id) ON DELETE CASCADE
profile_id          UUID REFERENCES search_profiles(id) ON DELETE CASCADE
fit_score           DECIMAL(3,1)             -- 1.0 - 10.0
matched_skills      TEXT[]                   -- skills que coinciden con el perfil
missing_skills      TEXT[]                   -- skills que pide pero no tiene
summary             TEXT                     -- resumen enfocado en el rol del perfil
salary_min          INTEGER                  -- en MXN, null si no se puede inferir
salary_max          INTEGER                  -- en MXN, null si no se puede inferir
salary_is_inferred  BOOLEAN DEFAULT false    -- true si la IA lo estimó, false si era explícito
benefits            TEXT[]                   -- ["seguro médico", "home office", "vales"]
benefits_is_inferred BOOLEAN DEFAULT false   -- true si la IA los infirió
analyzed_at         TIMESTAMPTZ DEFAULT NOW()

UNIQUE(job_id, profile_id)               -- un análisis por oferta × perfil
```

### `refresh_tokens`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
token_hash  VARCHAR(255) NOT NULL               -- hash del refresh token
expires_at  TIMESTAMPTZ NOT NULL
created_at  TIMESTAMPTZ DEFAULT NOW()
```

---

## Microservicio Python

### Responsabilidades
- Correr Jobspy con los parámetros configurados
- Enviar las ofertas a NestJS vía `POST /jobs/ingest`
- Exponer `POST /scrape` para trigger manual desde NestJS
- Cron interno cada 6 horas con APScheduler

### Configuración (`config.py`)
```python
SEARCH_TERMS = ["software engineer", "frontend developer", "backend developer"]
LOCATIONS    = ["Mexico", "Remote"]
RESULTS      = 30
HOURS_OLD    = 48
NESTJS_URL   = "http://localhost:3000"
```

### Archivo principal (`main.py`)
```python
from fastapi import FastAPI
from jobspy import scrape_jobs
from apscheduler.schedulers.background import BackgroundScheduler
import httpx
from config import *

app = FastAPI()
scheduler = BackgroundScheduler()

def do_scrape():
    jobs = scrape_jobs(
        site_name=["linkedin", "indeed"],
        search_term=SEARCH_TERMS,
        location=LOCATIONS,
        results_wanted=RESULTS,
        hours_old=HOURS_OLD,
    )
    httpx.post(f"{NESTJS_URL}/jobs/ingest",
               json=jobs.to_dict(orient="records"),
               timeout=30)

scheduler.add_job(do_scrape, "interval", hours=6)
scheduler.start()

@app.post("/scrape")
def scrape_now():
    do_scrape()
    return {"ok": True}
```

### Dependencias (`requirements.txt`)
```
fastapi
uvicorn
jobspy
apscheduler
httpx
```

---

## Módulos NestJS

### `AuthModule`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/auth/login` | POST | Recibe email + password, retorna access token (cookie) + refresh token (cookie) |
| `/auth/logout` | POST | Limpia las cookies y revoca el refresh token en DB |
| `/auth/refresh` | POST | Rota el refresh token y emite nuevo access token |
| `/auth/me` | GET | Retorna el usuario autenticado (protegido con JwtGuard) |

**Estrategias Passport:**
- `LocalStrategy` — valida email + password en login
- `JwtStrategy` — valida el access token JWT en cada request protegido

**Guard global:** `JwtAuthGuard` aplicado globalmente en `AppModule`. Solo `/auth/login` se decora con `@Public()` para saltarlo.

**Tokens:**
- Access token: JWT firmado, duración 15 minutos, viaja en cookie HttpOnly `access_token`
- Refresh token: UUID aleatorio hasheado en DB, duración 7 días, viaja en cookie HttpOnly `refresh_token`

**Flujo de login:**
1. `LocalStrategy` valida credenciales y llama a `bcrypt.compare`
2. Se genera access token JWT y refresh token UUID
3. El refresh token se hashea y guarda en `refresh_tokens`
4. Ambos tokens se setean como cookies HttpOnly con `SameSite=Strict`
5. Se retorna el usuario sin `password_hash`

**Flujo de refresh:**
1. Se lee `refresh_token` de la cookie
2. Se busca en DB por hash, se verifica que no esté expirado
3. Se revoca el token usado (rotación) y se emite uno nuevo
4. Se actualiza la cookie

### `ProfilesModule`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/profiles` | GET | Lista todos los perfiles del usuario autenticado |
| `/profiles` | POST | Crea un nuevo perfil de búsqueda |
| `/profiles/:id` | PATCH | Actualiza nombre, rol, keywords, locations o is_active |
| `/profiles/:id` | DELETE | Elimina un perfil y sus análisis asociados |

**Notas:**
- Un usuario puede tener múltiples perfiles activos simultáneamente
- Al crear o activar un perfil, se disparan análisis de todas las ofertas existentes contra ese perfil
- `keywords` alimenta directamente los `search_term` del scraper Python

### `UsersModule`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/users` | GET | Lista los dos usuarios |
| `/users/:id` | GET | Perfil de un usuario |
| `/users/:id/cv` | POST | Sube PDF, extrae texto con pdf-parse, guarda cv_text |

**Flujo de upload:**
1. Recibe multipart/form-data con el PDF
2. `pdf-parse` extrae el texto
3. Se guarda `cv_text`, `cv_filename`, `cv_uploaded_at` en la tabla `users`
4. Retorna confirmación con cantidad de caracteres extraídos

### `JobsModule`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/jobs` | GET | Lista ofertas con análisis del usuario autenticado, filtrables por perfil |
| `/jobs/top` | GET | Top 5 ofertas por perfil activo del usuario autenticado |
| `/jobs/:id` | GET | Detalle de oferta con todos los análisis por perfil |
| `/jobs/ingest` | POST | Recibe batch del scraper, deduplicado por URL |
| `/jobs/scrape` | POST | Llama al microservicio Python con las keywords de los perfiles activos |

**Query params de `/jobs`:**
- `profile_id` — filtra por perfil específico
- `min_score` — score mínimo (default: 0)
- `source` — 'linkedin' | 'indeed'
- `page`, `limit` — paginación

**Flujo de ingest:**
1. Recibe array de ofertas del scraper
2. Filtra duplicados por `url` (upsert o skip)
3. Para cada oferta nueva, dispara `GroqService.analyzeJob()` por cada perfil activo de todos los usuarios que tengan `cv_text`
4. Guarda resultados en `job_analyses`

**Flujo de `/jobs/top`:**
1. Obtiene todos los perfiles activos del usuario autenticado
2. Por cada perfil, consulta las 5 ofertas con mayor `fit_score`
3. Retorna un objeto agrupado por perfil: `{ [profileId]: Job[] }`

### `GroqModule`
Servicio interno, no expone endpoints propios.

**Método principal:** `analyzeJob(job: Job, user: User): Promise<JobAnalysis>`

**Método principal:** `analyzeJob(job: Job, profile: SearchProfile, user: User): Promise<JobAnalysis>`

**Prompt:**
```
Eres un reclutador técnico experto. Evalúa esta oferta para un desarrollador que busca 
un puesto de {profile.role.toUpperCase()} ({profile.name}).

Enfócate EXCLUSIVAMENTE en habilidades y experiencia relevantes para {profile.role}.
Aunque el CV tenga experiencia en otras áreas, evalúa solo lo que aplica a este rol.

OFERTA:
Título: {job.title}
Empresa: {job.company}
Descripción: {job.description}

CV DE {user.name}:
{user.cv_text}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "fit_score": <número del 1.0 al 10.0>,
  "matched_skills": [<skills relevantes para {profile.role} que coinciden>],
  "missing_skills": [<skills de {profile.role} que pide pero no tiene>],
  "summary": "<2-3 oraciones enfocadas en el match para el rol {profile.role}>",
  "salary_min": <número entero en MXN o null si no se puede estimar>,
  "salary_max": <número entero en MXN o null si no se puede estimar>,
  "salary_is_inferred": <true si lo estimaste, false si estaba explícito>,
  "benefits": [<lista de prestaciones mencionadas o inferidas>],
  "benefits_is_inferred": <true si los inferiste del tipo de empresa/oferta>
}
```

**Nota sobre salario:** Si la oferta no menciona salario, estímalo basándote en el rol, 
nivel de seniority, stack requerido y mercado mexicano. Marca `salary_is_inferred: true`.
Si no hay suficiente información ni para estimar, usa `null`.

---

## Frontend Nuxt

### Vistas

#### `/login` — Login
- Formulario de email + password
- Redirige al dashboard si ya hay sesión activa
- Única vista pública

#### `/` — Dashboard principal
Dos secciones principales:

**Sección Top 5 por perfil** — cards horizontales, una por perfil activo del usuario:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🟣 Frontend Osvaldo                              Top 5 esta semana  │
├──────────────────┬────────┬─────────────┬──────────────────────────┤
│ Sr. Vue Dev @... │ 🟢 9.1 │ $45k-60k MXN│ Vue · TS · Nuxt         │
│ React Dev @...   │ 🟢 8.7 │ $40k-55k MXN│ React · Node            │
│ Frontend @...    │ 🟡 7.2 │ ~$35k MXN ⚠ │ Angular · RxJS          │
└──────────────────┴────────┴─────────────┴──────────────────────────┘
⚠ salario inferido por IA

┌─────────────────────────────────────────────────────────────────────┐
│ 🔵 Backend Osvaldo                               Top 5 esta semana  │
├──────────────────┬────────┬─────────────┬──────────────────────────┤
│ Node Sr @...     │ 🟢 9.4 │ $50k-70k MXN│ NestJS · PostgreSQL     │
│ ...              │ ...    │ ...         │ ...                      │
└──────────────────┴────────┴─────────────┴──────────────────────────┘
```

**Sección Todas las ofertas** — tabla completa filtrable:
- Filtros: perfil, score mínimo, fuente (LinkedIn/Indeed), fecha, solo con salario
- Columnas: título, empresa, score, salario estimado, skills match, fecha
- Badge: 🟢 score ≥ 7, 🟡 score ≥ 5, 🔴 score < 5
- Ícono ⚠ cuando salario o prestaciones son inferidos por IA
- Botón "Actualizar ofertas" (trigger manual del scraper)

#### `/jobs/:id` — Detalle de oferta
- Información completa de la oferta (título, empresa, descripción completa, fuente)
- Salario y prestaciones extraídos por IA con indicador de si son inferidos o explícitos
- Tarjetas de análisis agrupadas por usuario, una por perfil activo:
  - Score del perfil, skills que coinciden, skills faltantes, resumen enfocado en el rol
- Link directo a la oferta original

#### `/profile` — Perfil de usuario
- Ver CV cargado actualmente, subir nuevo PDF
- Mostrar cantidad de caracteres extraídos y fecha de carga
- Gestión de perfiles de búsqueda:
  - Ver perfiles activos e inactivos
  - Crear perfil: nombre, rol, keywords, ubicaciones
  - Activar/desactivar perfil sin eliminarlo
  - Eliminar perfil

---

## Fases de desarrollo

### Fase 1 — Infraestructura base
1. Setup monorepo: `scraper/`, `backend/`, `frontend/`
2. NestJS: configurar TypeORM + PostgreSQL + migraciones iniciales
3. NestJS: `AuthModule` con login, refresh, logout y guard global
4. Seed script para crear los dos usuarios iniciales
5. NestJS: módulo `Users` con endpoint de CV upload (`pdf-parse`)
6. Microservicio Python: Jobspy + FastAPI + cron básico

### Fase 2 — Pipeline de datos
5. NestJS: `ProfilesModule` con CRUD de perfiles de búsqueda
6. NestJS: módulo `Jobs` con endpoint `/ingest`, deduplicación y `/top`
7. NestJS: `GroqService` con prompt por perfil, extracción de salario y prestaciones
8. Conectar ingest → análisis automático por cada perfil activo

### Fase 3 — Frontend
9. Nuxt: setup con TanStack Query + Pinia
10. Dashboard: sección Top 5 por perfil + tabla completa con filtros
11. Vista detalle de oferta con análisis por perfil y datos de salario/prestaciones
12. Vista de perfil: upload de CV + gestión de perfiles de búsqueda
13. Trigger manual del scraper desde UI

### Fase 4 — Futuro
- Notificaciones por correo cuando aparece una oferta con score alto
- Aplicación automática vía formularios web (Playwright)
- Seguimiento de estado por oferta (aplicado, respuesta, entrevista)
- Filtros avanzados por stack tecnológico detectado

---

## Consideraciones técnicas

### Deduplicación de ofertas
La columna `url` en `jobs` tiene constraint `UNIQUE`. El ingest hace un insert con `ON CONFLICT (url) DO NOTHING` para evitar reprocesar ofertas ya analizadas.

### Rate limiting de Groq
El análisis se corre por oferta × usuario. Con 30 ofertas nuevas y 2 usuarios son 60 llamadas a Groq. Usar un queue simple (o `Promise.allSettled` con delay entre lotes) para no saturar la API.

### Variables de entorno

**Backend (`.env`):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/jobtracker
GROQ_API_KEY=gsk_...
SCRAPER_URL=http://localhost:8000
JWT_SECRET=cambia_esto_por_un_string_largo_aleatorio
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
```

**Scraper (`.env`):**
```
NESTJS_URL=http://localhost:3000
```

### Correr en local
```bash
# Instalar todas las dependencias JS desde la raíz
pnpm install

# Levantar backend y frontend en paralelo
pnpm dev

# O individualmente
pnpm dev:backend
pnpm dev:frontend

# Scraper Python (separado)
cd scraper && pip install -r requirements.txt && uvicorn main:app --port 8000
```

---

## Monorepo

El proyecto usa **pnpm workspaces** para gestionar backend y frontend en un solo repositorio. El scraper Python vive en el mismo repo pero fuera del workspace de pnpm.

### ¿Por qué pnpm workspaces y no Turborepo?
Con 2 apps y 1 package compartido, Turborepo es overhead innecesario. pnpm workspaces cubre todo lo que necesitamos: instalación unificada, scripts globales y tipos compartidos.

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `package.json` raíz
```json
{
  "name": "job-tracker",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "dev:backend": "pnpm --filter backend dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint"
  }
}
```

### Package compartido — `packages/shared`

Los tipos TypeScript se definen una sola vez y se importan en backend y frontend:

```ts
// packages/shared/types/job.types.ts
export type ProfileRole = 'frontend' | 'backend' | 'fullstack' | 'mobile'

export interface SearchProfile {
  id: string
  user_id: string
  name: string
  role: ProfileRole
  keywords: string[]
  locations: string[]
  is_active: boolean
  created_at: string
}

export interface JobAnalysis {
  fit_score: number
  matched_skills: string[]
  missing_skills: string[]
  summary: string
  salary_min: number | null
  salary_max: number | null
  salary_is_inferred: boolean
  benefits: string[]
  benefits_is_inferred: boolean
  profile: SearchProfile
}

export interface JobWithAnalyses {
  id: string
  title: string
  company: string
  location: string
  url: string
  source: 'linkedin' | 'indeed'
  date_posted: string
  scraped_at: string
  analyses: JobAnalysis[]             // uno por perfil activo
}

export interface TopByProfile {
  profile: SearchProfile
  jobs: JobWithAnalyses[]             // máximo 5
}

export interface User {
  id: string
  name: string
  email: string
  cv_uploaded_at: string | null
  profiles: SearchProfile[]
}
```

```ts
// En NestJS
import type { JobAnalysis } from '@job-tracker/shared'

// En Nuxt
import type { JobWithAnalyses, User } from '@job-tracker/shared'
```

### `packages/shared/package.json`
```json
{
  "name": "@job-tracker/shared",
  "version": "0.0.1",
  "main": "./index.ts",
  "exports": {
    ".": "./index.ts"
  }
}
```

---

## Estructura de carpetas

```
job-tracker/
├── pnpm-workspace.yaml
├── package.json                   ← scripts globales
├── .env                           ← variables compartidas (gitignored)
├── .gitignore
│
├── apps/
│   ├── backend/                   ← NestJS
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── local-auth.guard.ts
│   │   │   │   └── decorators/
│   │   │   │       └── public.decorator.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   └── entities/
│   │   │   │       ├── user.entity.ts
│   │   │   │       └── refresh-token.entity.ts
│   │   │   ├── profiles/
│   │   │   │   ├── profiles.module.ts
│   │   │   │   ├── profiles.service.ts
│   │   │   │   ├── profiles.controller.ts
│   │   │   │   └── entities/search-profile.entity.ts
│   │   │   ├── jobs/
│   │   │   │   ├── jobs.module.ts
│   │   │   │   ├── jobs.service.ts
│   │   │   │   ├── jobs.controller.ts
│   │   │   │   └── entities/
│   │   │   │       ├── job.entity.ts
│   │   │   │       └── job-analysis.entity.ts
│   │   │   ├── groq/
│   │   │   │   ├── groq.module.ts
│   │   │   │   └── groq.service.ts
│   │   │   └── app.module.ts
│   │   ├── .env
│   │   └── package.json
│   │
│   └── frontend/                  ← Nuxt
│       ├── pages/
│       │   ├── login.vue          ← pública
│       │   ├── index.vue          ← dashboard
│       │   ├── jobs/[id].vue      ← detalle
│       │   └── profile.vue        ← CV upload
│       ├── components/
│       │   ├── JobTable.vue
│       │   ├── TopProfileCard.vue
│       │   ├── AnalysisCard.vue
│       │   ├── SalaryBadge.vue
│       │   ├── ScoreBadge.vue
│       │   └── ProfileForm.vue
│       ├── composables/
│       │   ├── useAuth.ts
│       │   ├── useJobs.ts
│       │   ├── useProfiles.ts
│       │   └── useUsers.ts
│       ├── .env
│       └── package.json
│
├── packages/
│   └── shared/                    ← tipos TypeScript compartidos
│       ├── types/
│       │   ├── job.types.ts
│       │   ├── user.types.ts
│       │   ├── profile.types.ts
│       │   └── analysis.types.ts
│       ├── index.ts
│       └── package.json
│
└── scraper/                       ← microservicio Python (fuera del workspace)
    ├── main.py
    ├── config.py
    └── requirements.txt
```

---

## Autenticación

El sistema usa JWT con Passport. Todos los endpoints están protegidos por defecto mediante un guard global. Solo `/auth/login` es público.

### Dependencias
```bash
pnpm --filter backend add @nestjs/passport @nestjs/jwt passport passport-local passport-jwt bcrypt
pnpm --filter backend add -D @types/passport-local @types/passport-jwt @types/bcrypt
```

### Guard global en `AppModule`
```ts
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'

@Module({
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
```

### Decorator `@Public()`
```ts
// auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common'
export const Public = () => SetMetadata('isPublic', true)
```

```ts
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get('isPublic', context.getHandler())
    if (isPublic) return true
    return super.canActivate(context)
  }
}
```

### Cookies
Los tokens viajan en cookies HttpOnly para evitar acceso desde JS del cliente:

```ts
// En AuthController.login()
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: true,           // HTTPS en producción
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutos
})

res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
})
```

### Seed script
Los dos usuarios se crean una sola vez con un script, no hay registro público:

```ts
// apps/backend/src/seed.ts
import * as bcrypt from 'bcrypt'

const users = [
  { name: 'Osvaldo', email: 'osvaldo@example.com', password: 'tu_password' },
  { name: 'Guillermo', email: 'guillermo@example.com', password: 'su_password' },
]

for (const u of users) {
  await userRepository.save({
    ...u,
    password_hash: await bcrypt.hash(u.password, 12),
  })
}
```

```bash
pnpm --filter backend seed
```

### Integración en Nuxt con `nuxt-auth-utils`
```bash
pnpm --filter frontend add nuxt-auth-utils
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
})
```

```ts
// composables/useAuth.ts
export const useAuth = () => {
  const { loggedIn, user, clear } = useUserSession()

  const login = async (email: string, password: string) => {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    clear()
    navigateTo('/login')
  }

  return { loggedIn, user, login, logout }
}
```

Las cookies HttpOnly las maneja el browser automáticamente — Nuxt no necesita guardar nada en localStorage ni Pinia para el token.

### Vista `/login`
Única vista pública del frontend. Redirige al dashboard si ya hay sesión activa.


---

## Implementación del GroqService

### Instalación
```bash
pnpm --filter backend add openai
```
> Groq es compatible con el SDK oficial de OpenAI — no hay SDK propio que instalar.

### `apps/backend/src/groq/groq.service.ts`
```ts
import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { Job } from '../jobs/entities/job.entity'
import { User } from '../users/entities/user.entity'
import { SearchProfile } from '../profiles/entities/search-profile.entity'
import { JobAnalysis } from '@job-tracker/shared'

@Injectable()
export class GroqService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }

  async analyzeJob(job: Job, profile: SearchProfile, user: User): Promise<JobAnalysis> {
    const prompt = `
Eres un reclutador técnico experto. Evalúa esta oferta para un desarrollador que busca
un puesto de ${profile.role.toUpperCase()} (perfil: ${profile.name}).

Enfócate EXCLUSIVAMENTE en habilidades relevantes para ${profile.role}.
Aunque el CV tenga experiencia en otras áreas, evalúa solo lo que aplica a este rol.

OFERTA:
Título: ${job.title}
Empresa: ${job.company}
Descripción: ${job.description}

CV DE ${user.name}:
${user.cv_text}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "fit_score": <número 1.0-10.0>,
  "matched_skills": [<skills de ${profile.role} que coinciden>],
  "missing_skills": [<skills de ${profile.role} que pide pero no tiene>],
  "summary": "<2-3 oraciones enfocadas en el match para ${profile.role}>",
  "salary_min": <entero en MXN o null>,
  "salary_max": <entero en MXN o null>,
  "salary_is_inferred": <true si lo estimaste, false si era explícito>,
  "benefits": [<prestaciones mencionadas o inferidas>],
  "benefits_is_inferred": <true si los inferiste>
}

Sobre el salario: si no se menciona, estímalo según el rol ${profile.role},
seniority requerido, stack y mercado mexicano. Marca salary_is_inferred: true.
Si no hay información suficiente, usa null.
    `.trim()

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const raw = response.choices[0].message.content ?? '{}'
    return JSON.parse(raw) as JobAnalysis
  }
}
```