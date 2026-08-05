/** Reference geo data used to plot AI-classified, free-text locations
 * (Job.location_country / location_region / location_city) on the
 * dashboard's dotted maps. Lookups are alias-based because the classifier
 * (see build-work-mode-prompt.ts) writes natural-language names, not codes,
 * and may answer in Spanish or English. */

export interface CountryRef {
  iso3: string;
  name: string;
  lat: number;
  lon: number;
}

export interface PlaceRef {
  name: string;
  lat: number;
  lon: number;
}

/** Strips accents/casing/whitespace so "México", "mexico" and "MEXICO "
 * all resolve to the same lookup key. */
const COMBINING_DIACRITICS = new RegExp('[̀-ͯ]', 'g');

export function normalizeLocationKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function buildIndex<T>(entries: Array<[T, string[]]>): Record<string, T> {
  const index: Record<string, T> = {};

  for (const [ref, aliases] of entries) {
    for (const alias of aliases) {
      index[normalizeLocationKey(alias)] = ref;
    }
  }

  return index;
}

const country = (
  iso3: string,
  name: string,
  lat: number,
  lon: number,
): CountryRef => ({ iso3, name, lat, lon });

// Countries this scraper's postings realistically surface: Mexico first
// (the primary market), then the Americas and the other markets AI/tech
// postings tend to come from.
export const COUNTRY_INDEX: Record<string, CountryRef> = buildIndex<CountryRef>(
  [
    [
      country('MEX', 'Mexico', 23.6345, -102.5528),
      ['mexico', 'méxico', 'mex', 'mx'],
    ],
    [
      country('USA', 'United States', 39.8283, -98.5795),
      [
        'united states',
        'united states of america',
        'usa',
        'us',
        'estados unidos',
        'estados unidos de america',
        'eeuu',
        'ee.uu.',
      ],
    ],
    [country('CAN', 'Canada', 56.1304, -106.3468), ['canada', 'canadá']],
    [country('GTM', 'Guatemala', 15.7835, -90.2308), ['guatemala']],
    [country('BLZ', 'Belize', 17.1899, -88.4976), ['belize', 'belice']],
    [country('HND', 'Honduras', 15.2, -86.2419), ['honduras']],
    [
      country('SLV', 'El Salvador', 13.7942, -88.8965),
      ['el salvador', 'salvador'],
    ],
    [country('NIC', 'Nicaragua', 12.8654, -85.2072), ['nicaragua']],
    [country('CRI', 'Costa Rica', 9.7489, -83.7534), ['costa rica']],
    [country('PAN', 'Panama', 8.538, -80.7821), ['panama', 'panamá']],
    [country('CUB', 'Cuba', 21.5218, -77.7812), ['cuba']],
    [
      country('DOM', 'Dominican Republic', 18.7357, -70.1627),
      ['dominican republic', 'republica dominicana', 'república dominicana'],
    ],
    [country('COL', 'Colombia', 4.5709, -74.2973), ['colombia']],
    [country('VEN', 'Venezuela', 6.4238, -66.5897), ['venezuela']],
    [country('ECU', 'Ecuador', -1.8312, -78.1834), ['ecuador']],
    [country('PER', 'Peru', -9.19, -75.0152), ['peru', 'perú']],
    [country('BOL', 'Bolivia', -16.2902, -63.5887), ['bolivia']],
    [country('CHL', 'Chile', -35.6751, -71.543), ['chile']],
    [country('ARG', 'Argentina', -38.4161, -63.6167), ['argentina']],
    [country('URY', 'Uruguay', -32.5228, -55.7658), ['uruguay']],
    [country('PRY', 'Paraguay', -23.4425, -58.4438), ['paraguay']],
    [country('BRA', 'Brazil', -14.235, -51.9253), ['brazil', 'brasil']],
    [country('ESP', 'Spain', 40.4637, -3.7492), ['spain', 'españa', 'espana']],
    [country('PRT', 'Portugal', 39.3999, -8.2245), ['portugal']],
    [
      country('GBR', 'United Kingdom', 55.3781, -3.436),
      [
        'united kingdom',
        'uk',
        'reino unido',
        'england',
        'inglaterra',
        'great britain',
      ],
    ],
    [country('IRL', 'Ireland', 53.1424, -7.6921), ['ireland', 'irlanda']],
    [country('FRA', 'France', 46.2276, 2.2137), ['france', 'francia']],
    [
      country('DEU', 'Germany', 51.1657, 10.4515),
      ['germany', 'alemania', 'deutschland'],
    ],
    [
      country('NLD', 'Netherlands', 52.1326, 5.2913),
      ['netherlands', 'holanda', 'paises bajos', 'países bajos'],
    ],
    [country('CHE', 'Switzerland', 46.8182, 8.2275), ['switzerland', 'suiza']],
    [country('POL', 'Poland', 51.9194, 19.1451), ['poland', 'polonia']],
    [country('ITA', 'Italy', 41.8719, 12.5674), ['italy', 'italia']],
    [country('IND', 'India', 20.5937, 78.9629), ['india']],
    [country('CHN', 'China', 35.8617, 104.1954), ['china']],
    [country('SGP', 'Singapore', 1.3521, 103.8198), ['singapore', 'singapur']],
    [country('AUS', 'Australia', -25.2744, 133.7751), ['australia']],
    [country('JPN', 'Japan', 36.2048, 138.2529), ['japan', 'japon', 'japón']],
    [
      country('ARE', 'United Arab Emirates', 23.4241, 53.8478),
      [
        'united arab emirates',
        'uae',
        'emiratos arabes unidos',
        'emiratos árabes unidos',
      ],
    ],
  ],
);

const place = (name: string, lat: number, lon: number): PlaceRef => ({
  name,
  lat,
  lon,
});

// The 32 Mexican federal entities, with common accented/unaccented and
// colloquial aliases the classifier is likely to produce.
export const MX_STATE_INDEX: Record<string, PlaceRef> = buildIndex<PlaceRef>([
  [place('Aguascalientes', 21.8853, -102.2916), ['aguascalientes']],
  [
    place('Baja California', 30.8406, -115.2838),
    ['baja california', 'baja california norte'],
  ],
  [place('Baja California Sur', 26.0444, -111.6661), ['baja california sur']],
  [place('Campeche', 19.8301, -90.5349), ['campeche']],
  [place('Chiapas', 16.7569, -93.1292), ['chiapas']],
  [place('Chihuahua', 28.632, -106.0691), ['chihuahua']],
  [
    place('Ciudad de México', 19.4326, -99.1332),
    ['ciudad de mexico', 'cdmx', 'distrito federal', 'df', 'mexico city'],
  ],
  [place('Coahuila', 27.0587, -101.7068), ['coahuila', 'coahuila de zaragoza']],
  [place('Colima', 19.2452, -103.7241), ['colima']],
  [place('Durango', 24.5593, -104.6588), ['durango']],
  [
    place('Estado de México', 19.3587, -99.8663),
    ['estado de mexico', 'edomex', 'mexico state', 'méxico (estado)'],
  ],
  [place('Guanajuato', 21.019, -101.2574), ['guanajuato']],
  [place('Guerrero', 17.4392, -99.5451), ['guerrero']],
  [place('Hidalgo', 20.0911, -98.7624), ['hidalgo']],
  [place('Jalisco', 20.6595, -103.3494), ['jalisco']],
  [place('Michoacán', 19.5665, -101.7068), ['michoacan']],
  [place('Morelos', 18.6813, -99.1013), ['morelos']],
  [place('Nayarit', 21.7514, -104.8455), ['nayarit']],
  [place('Nuevo León', 25.5922, -99.9962), ['nuevo leon']],
  [place('Oaxaca', 17.0732, -96.7266), ['oaxaca']],
  [place('Puebla', 19.0414, -98.2063), ['puebla']],
  [place('Querétaro', 20.5888, -100.3899), ['queretaro']],
  [place('Quintana Roo', 19.1817, -88.4791), ['quintana roo']],
  [place('San Luis Potosí', 22.1565, -100.9855), ['san luis potosi']],
  [place('Sinaloa', 25.1721, -107.4795), ['sinaloa']],
  [place('Sonora', 29.2972, -110.3309), ['sonora']],
  [place('Tabasco', 17.8409, -92.6189), ['tabasco']],
  [place('Tamaulipas', 24.2669, -98.8363), ['tamaulipas']],
  [place('Tlaxcala', 19.3182, -98.2375), ['tlaxcala']],
  [
    place('Veracruz', 19.1738, -96.1342),
    ['veracruz', 'veracruz de ignacio de la llave'],
  ],
  [place('Yucatán', 20.7099, -89.0943), ['yucatan']],
  [place('Zacatecas', 22.7709, -102.5832), ['zacatecas']],
]);

// A modest set of major Mexican cities/metro areas commonly seen in job
// postings. Cities not in this list still count toward totals — they just
// won't get a dedicated pin.
export const MX_CITY_INDEX: Record<string, PlaceRef> = buildIndex<PlaceRef>([
  [
    place('Ciudad de México', 19.4326, -99.1332),
    ['ciudad de mexico', 'cdmx', 'mexico city', 'distrito federal'],
  ],
  [place('Guadalajara', 20.6597, -103.3496), ['guadalajara']],
  [place('Zapopan', 20.7214, -103.3919), ['zapopan']],
  [place('Monterrey', 25.6866, -100.3161), ['monterrey']],
  [
    place('San Pedro Garza García', 25.6514, -100.402),
    ['san pedro garza garcia'],
  ],
  [place('Puebla', 19.0414, -98.2063), ['puebla', 'puebla de zaragoza']],
  [place('Querétaro', 20.5888, -100.3899), ['queretaro']],
  [place('Tijuana', 32.5149, -117.0382), ['tijuana']],
  [place('León', 21.1619, -101.6921), ['leon']],
  [place('Mérida', 20.9674, -89.5926), ['merida']],
  [place('Toluca', 19.2926, -99.6568), ['toluca']],
  [place('Cancún', 21.1619, -86.8515), ['cancun']],
  [place('San Luis Potosí', 22.1565, -100.9855), ['san luis potosi']],
  [place('Aguascalientes', 21.8853, -102.2916), ['aguascalientes']],
  [place('Chihuahua', 28.632, -106.0691), ['chihuahua']],
  [place('Hermosillo', 29.0729, -110.9559), ['hermosillo']],
  [place('Culiacán', 24.8091, -107.394), ['culiacan']],
  [place('Saltillo', 25.4232, -101.0053), ['saltillo']],
  [place('Torreón', 25.5428, -103.4068), ['torreon']],
  [place('Veracruz', 19.1738, -96.1342), ['veracruz']],
  [place('Xalapa', 19.5438, -96.9102), ['xalapa']],
  [place('Morelia', 19.7008, -101.1844), ['morelia']],
  [place('Cuernavaca', 18.9186, -99.234), ['cuernavaca']],
  [place('Villahermosa', 17.9895, -92.9475), ['villahermosa']],
  [place('Mexicali', 32.6245, -115.4523), ['mexicali']],
  [place('Ciudad Juárez', 31.6904, -106.4245), ['ciudad juarez']],
]);
