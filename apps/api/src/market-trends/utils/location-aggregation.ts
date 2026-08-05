import { Job } from '../../jobs/entities/job.entity';
import {
  COUNTRY_INDEX,
  MX_CITY_INDEX,
  MX_STATE_INDEX,
  normalizeLocationKey,
  PlaceRef,
} from './geo-reference';

export interface GeoCount {
  label: string;
  count: number;
  lat: number | null;
  lon: number | null;
  iso3?: string | null;
}

export interface LocationInsights {
  by_country: GeoCount[];
  mexico_by_region: GeoCount[];
  mexico_by_city: GeoCount[];
  total_with_location: number;
  total_mexico: number;
}

interface Bucket<Ref> {
  label: string;
  count: number;
  ref: Ref | null;
}

function bump<Ref>(
  buckets: Map<string, Bucket<Ref>>,
  bucketKey: string,
  label: string,
  ref: Ref | null,
): void {
  const existing = buckets.get(bucketKey);

  if (existing) {
    existing.count += 1;
    return;
  }

  buckets.set(bucketKey, { label, count: 1, ref });
}

function toGeoCounts(
  buckets: Map<string, Bucket<PlaceRef>>,
  limit: number,
): GeoCount[] {
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((bucket) => ({
      label: bucket.ref?.name ?? bucket.label,
      count: bucket.count,
      lat: bucket.ref?.lat ?? null,
      lon: bucket.ref?.lon ?? null,
    }));
}

/** Aggregates the AI-classified, free-text location fields into ranked,
 * geocoded buckets for the dashboard's world/Mexico dotted maps. Locations
 * that don't match a known alias still count toward totals but sort to the
 * bottom (no coordinates to plot). */
export function aggregateLocations(jobs: Job[]): LocationInsights {
  const countryBuckets = new Map<
    string,
    Bucket<PlaceRef> & { iso3: string | null }
  >();
  const regionBuckets = new Map<string, Bucket<PlaceRef>>();
  const cityBuckets = new Map<string, Bucket<PlaceRef>>();

  let totalWithLocation = 0;
  let totalMexico = 0;

  for (const job of jobs) {
    const rawCountry = job.location_country?.trim();

    if (!rawCountry) {
      continue;
    }

    totalWithLocation += 1;

    const countryRef = COUNTRY_INDEX[normalizeLocationKey(rawCountry)] ?? null;
    const countryKey = countryRef?.iso3 ?? normalizeLocationKey(rawCountry);
    const existingCountry = countryBuckets.get(countryKey);

    if (existingCountry) {
      existingCountry.count += 1;
    } else {
      countryBuckets.set(countryKey, {
        label: countryRef?.name ?? rawCountry,
        count: 1,
        ref: countryRef,
        iso3: countryRef?.iso3 ?? null,
      });
    }

    if (countryRef?.iso3 !== 'MEX') {
      continue;
    }

    totalMexico += 1;

    const rawRegion = job.location_region?.trim();

    if (rawRegion) {
      const regionRef = MX_STATE_INDEX[normalizeLocationKey(rawRegion)] ?? null;
      const regionKey = regionRef?.name ?? normalizeLocationKey(rawRegion);
      bump(regionBuckets, regionKey, regionRef?.name ?? rawRegion, regionRef);
    }

    const rawCity = job.location_city?.trim();

    if (rawCity) {
      const cityRef = MX_CITY_INDEX[normalizeLocationKey(rawCity)] ?? null;
      const cityKey = cityRef?.name ?? normalizeLocationKey(rawCity);
      bump(cityBuckets, cityKey, cityRef?.name ?? rawCity, cityRef);
    }
  }

  const byCountry: GeoCount[] = [...countryBuckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
    .map((bucket) => ({
      label: bucket.label,
      count: bucket.count,
      lat: bucket.ref?.lat ?? null,
      lon: bucket.ref?.lon ?? null,
      iso3: bucket.iso3,
    }));

  return {
    by_country: byCountry,
    mexico_by_region: toGeoCounts(regionBuckets, 32),
    mexico_by_city: toGeoCounts(cityBuckets, 20),
    total_with_location: totalWithLocation,
    total_mexico: totalMexico,
  };
}
