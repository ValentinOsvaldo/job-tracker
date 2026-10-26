# Onboarding — Job Tracker

Guía para dejar el proyecto corriendo en tu máquina y empezar a trabajar, sobre todo en el frontend. Si algo no funciona como dice aquí, avísanos y corregimos la guía.

---

## 1. Qué es esto

Un tracker personal de ofertas de trabajo. Un usuario, sin login.

```
scrapper (Python, :8000) ──POST──▶ api (NestJS, :3000) ◀──▶ PostgreSQL (:5432)
  Jobspy + APScheduler             TypeORM + Gemini (IA)
                                          ▲
                                          │ HTTP (solo desde el servidor de Nuxt)
                                   web (Nuxt 4, :3001)
```

- **`apps/scrapper`** — busca ofertas en LinkedIn/Indeed con Jobspy y se las manda al API.
- **`apps/api`** — guarda ofertas, perfiles de búsqueda y CV; usa Gemini para scores de fit, resúmenes, tendencias y CV adaptado (PDF).
- **`apps/web`** — dashboard en Nuxt. Es lo que vas a tocar más.

> El `README.md` de la raíz tiene la especificación original (multiusuario, JWT, Groq). Ya no aplica en esas partes; esta guía refleja el estado actual.

---

## 2. Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 22.x | API y web |
| pnpm | 11.x (`corepack enable` lo instala) | monorepo |
| Docker Desktop | reciente | Postgres (y opcionalmente todo) |
| Python | 3.12 | solo si corres el scrapper fuera de Docker |
| API key de Gemini | — | pídela o crea la tuya en Google AI Studio |

Editor recomendado: VS Code con las extensiones de **Vue (Official)** y **ESLint**.

---

## 3. Arranque rápido (todo en Docker)

La forma más simple de ver la app funcionando:

```bash
cp .env.example .env      # pon tu GEMINI_API_KEY
docker compose up --build
```

- App: http://localhost:3001
- API / Swagger: http://localhost:3000/api
- Postgres: `localhost:5432` (usuario `postgres`, clave `postgres`, base `jobtracker`)

En Docker las migraciones corren solas al arrancar el API. Los datos viven en el volumen `postgres_data`.

---

## 3.1 Pre-setup para tu búsqueda (frontend, remoto, desde Venezuela)

La app venía configurada para México (Indeed México, salarios en MXN). Para buscar trabajo remoto en cualquier país:

**1. `.env` de la raíz** (si usas Docker) — o los `.env` de `apps/api` y `apps/scrapper` si corres local:

```env
GEMINI_API_KEY=tu_key

# IA: estima salarios en USD y analiza el mercado remoto, no el mexicano
JOB_MARKET=trabajo remoto internacional (empresas de EE.UU., Europa y LATAM que contratan desde Venezuela)
SALARY_CURRENCY=USD

# Scraper: solo ofertas remotas, Indeed en inglés (indeed.com)
SEARCH_TERMS=frontend developer,react developer,vue developer,frontend engineer
LOCATIONS=Remote
INDEED_COUNTRY=usa
IS_REMOTE=true
```

**2. En la app** (http://localhost:3001):

- **Account** → nombre y ubicación: `Venezuela`.
- **Profiles** → crea un perfil:
  - Nombre: `Frontend Remote`
  - Rol: `frontend`
  - Keywords: tu stack (ej. `react, typescript, vue, nuxt, tailwind`)
  - Locations: `Remote`, `Latin America` (estas ubicaciones son las que usa el scraper cuando el perfil está activo)
  - Salario: llena solo los campos **USD** (mensual, ej. 2000–4000). Deja MXN vacío.
- **CV** → sube tu CV en PDF, **en inglés**. Casi todas las ofertas remotas internacionales lo piden en inglés.
- **Resume profile** → llena tu experiencia; desde ahí la app genera CVs adaptados a cada oferta (inglés por defecto, con opción de español).

**3. Primer scrape:** en el dashboard dale al botón de scrape. Tarda un par de minutos; después la IA calcula el fit score de cada oferta contra tu perfil.

> Tip: muchas ofertas "remote" de EE.UU. solo aceptan residentes de EE.UU. El summary de la IA suele mencionarlo; busca también términos como `LATAM` o `contractor` en `SEARCH_TERMS` para encontrar empresas que contratan internacionalmente.

---

## 4. Desarrollo local (recomendado para programar)

Postgres en Docker y lo demás nativo, para tener hot reload.

```bash
# 1. Solo la base de datos
docker compose up -d postgres

# 2. Dependencias (desde la raíz)
pnpm install

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env          # pon tu GEMINI_API_KEY
cp apps/web/.env.example apps/web/.env
cp apps/scrapper/.env.example apps/scrapper/.env

# 4. Levantar (en local TypeORM crea las tablas solo con `synchronize`)
pnpm start:api      # http://localhost:3000/api
pnpm start:web      # http://localhost:3001
```

### Scrapper (opcional)

Solo lo necesitas si vas a probar el scraping. Sin él la app funciona, pero el botón de "scrape" va a fallar.

```bash
cd apps/scrapper
python -m venv .venv
.venv\Scripts\activate        # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cd ../..
pnpm start:scrapper
```

> `pnpm start:scrapper` y `pnpm start:all` usan la ruta de Windows `.venv\Scripts\python`. En macOS/Linux corre el scrapper a mano:
> `cd apps/scrapper && .venv/bin/python -m uvicorn main:app --reload --port 8000`

`pnpm start:all` levanta API + web + scrapper juntos.

---

## 5. Frontend (`apps/web`)

### Stack

- **Nuxt 4** + Vue 3 (`<script setup lang="ts">`)
- **Nuxt UI v4** — el design system. Usa sus componentes (`UButton`, `UCard`, `UTable`, `UModal`, `UForm`…), no hagas controles a mano.
- **Pinia Colada** (`useQuery` / `useMutation`) — fetching y caché
- **nuxt-charts** — gráficas
- **@vite-pwa/nuxt** — instalable como PWA
- Tailwind CSS v4 (viene con Nuxt UI)

### Estructura

```
apps/web/
├── app/
│   ├── pages/              # rutas (index = dashboard, jobs/, profiles, cv, settings…)
│   ├── components/         # componentes (auto-import, no hace falta importarlos)
│   ├── composables/
│   │   └── useApiClient.ts # todas las queries/llamadas al backend en un solo lugar
│   ├── types/api.ts        # tipos compartidos de las respuestas del API
│   ├── utils/              # helpers puros (format, colorScale…)
│   ├── app.config.ts       # colores de Nuxt UI (primary: green)
│   └── assets/css/main.css
├── server/
│   ├── api/                # BFF: rutas de Nitro que reenvían al API de NestJS
│   └── utils/backend.ts    # backendFetch()
└── .interface-design/system.md   # reglas de diseño (léelo)
```

### Patrón BFF (importante)

El navegador **nunca** llama directo al API de NestJS. El flujo es:

```
componente → useApiClient() → /api/... (Nitro, server/api/*) → backendFetch() → NestJS :3000/api/...
```

- La URL del API solo existe del lado del servidor (`NUXT_API_BASE_URL`, en `runtimeConfig.apiBaseUrl`).
- `backendFetch` convierte los errores del API en errores de Nuxt con el mismo status code.

### Receta: agregar un endpoint + usarlo en una página

Ejemplo: listar algo nuevo llamado `notes`.

**1. Tipo** en `app/types/api.ts`:

```ts
export interface Note { id: string, text: string }
```

**2. Ruta BFF** en `server/api/notes/index.get.ts` (el nombre del archivo define método y ruta):

```ts
import type { Note } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<Note[]>('/api/notes')
})
```

Para un POST: `index.post.ts`, lees el body con `readBody(event)` y lo pasas en `backendFetch(..., { method: 'POST', body })`. Mira `server/api/profiles/` como referencia.

**3. Query** en `app/composables/useApiClient.ts`, junto a las demás:

```ts
const notesQuery = {
  key: ['notes'] as const,
  query: () => requestFetch<Note[]>('/api/notes')
}
// y agrégalo al objeto que retorna useApiClient()
```

**4. Página** en `app/pages/notes.vue`:

```vue
<script setup lang="ts">
const api = useApiClient()
const { data: notes, isPending, error } = useQuery({
  key: () => ['notes'],
  query: () => api.notesQuery.query()
})
</script>
```

Después de una mutación, refresca con `useQueryCache().invalidateQueries({ key: ['notes'] })` (ver `pages/profiles.vue`).

**5.** Si la página va en el menú, agrégala en `app/layouts/default.vue`.

### Reglas de diseño (resumen de `.interface-design/system.md`)

- **Nuxt UI primero.** No reinventes tokens ni componentes que ya trae.
- **Un solo acento: verde** (`primary`). El verde significa "marca / métrica principal", no decoración.
- **Profundidad solo con bordes** (`UCard` por defecto, `border-default`). Sin sombras custom.
- **Espaciado:** secciones `space-y-8`, dentro de secciones `space-y-4`, grids `gap-4`.
- **Gráficas:** siempre dentro de `<ClientOnly>` con un `USkeleton` del mismo alto como fallback (no renderizan en SSR). Toda gráfica tiene un empty state explícito.
- **Idioma de la UI:** títulos y chrome en inglés ("Dashboard", "Market trends"); contenido, toasts y empty states en español. Sigue lo que ya usa el texto de alrededor.
- **Mobile:** revisa que se vea bien en pantalla chica.

### Antes de subir cambios

```bash
pnpm --filter @job-tracker/web lint
pnpm --filter @job-tracker/web typecheck
```

---

## 6. Backend en corto (`apps/api`)

- NestJS por módulos: `jobs`, `profiles`, `job-analyses`, `market-trends`, `cv-analysis`, `resume`, `users`, `health`.
- IA en `src/ai/`: `prompts/` (los prompts), `providers/` (implementaciones con Gemini), `interfaces/`.
- Swagger en http://localhost:3000/api — útil para ver qué devuelve cada endpoint antes de armar el BFF.
- Todas las rutas llevan el prefijo `/api`.

### Migraciones (TypeORM)

Si cambias una entidad:

```bash
pnpm --filter @job-tracker/api migration:generate src/migrations/NombreDelCambio
pnpm --filter @job-tracker/api migration:run
pnpm --filter @job-tracker/api migration:revert   # deshacer la última
```

---

## 7. Problemas comunes

| Síntoma | Solución |
|---|---|
| `Set GEMINI_API_KEY in .env` al hacer `docker compose up` | Falta la key en el `.env` de la raíz. |
| `Missing environment variable: DATABASE_URL` | Falta `apps/api/.env` (copia el `.env.example`). |
| Errores de "relation does not exist" | En local revisa que `NODE_ENV` no sea `production` (con `production` hay que correr `migration:run`). |
| La web muestra error 502 / "Upstream API error" | El API no está corriendo o `NUXT_API_BASE_URL` apunta mal. |
| Puerto 3000/3001/5432 ocupado | Cierra lo que lo usa, o un Postgres local que ya tengas instalado. |
| pnpm pide aprobar builds de dependencias | Ya están listadas en `allowBuilds` de `pnpm-workspace.yaml`; si aparece una nueva, pregunta antes de aprobarla. |
| Quiero empezar con la base vacía | `docker compose down -v` (borra **todos** los datos). |

---

## 8. Flujo de git

1. Crea una rama desde `main`: `git checkout -b feat/lo-que-hagas`
2. Commits con prefijo: `feat:`, `fix:`, `docs:`, `refactor:`…
3. Lint y typecheck en verde.
4. PR a `main` y lo revisamos.

¡Bienvenido! Cualquier duda, pregunta.
