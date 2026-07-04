import type { ScanQrResult } from '../hooks/useCoffeePage';

export type CanonicalPublicationFields = {
  coffee: {
    name: string;
    variety: string | null;
    varieties: Array<{ id: string; name: string }>;
    processingMethod: string | null;
    producerNotes: string | null;
    imageUrl: string | null;
    storeUrl: string | null;
  };
  origin: {
    country: string | null;
    region: string | null;
    farm: string | null;
    producer: string | null;
    altitudeMin: number | null;
    altitudeMax: number | null;
    altitudeLabel: string | null;
  };
  batch: {
    id: string | null;
    lotNumber: string | null;
    roastDate: string | null;
    brewingNotes: string | null;
    roasterStory: string | null;
  };
  qr: {
    hash: string;
  };
};

export type NormalizedCoffeePageData = {
  source: 'canonical';
  hash: string;
  archived: boolean;
  roaster: {
    name: string | null;
    city: string | null;
    country: string | null;
    logoUrl: string | null;
    shortName: string | null;
  };
  product: {
    id: string;
    name: string;
    variety: string | null;
    varieties: Array<{ id: string; name: string }>;
    processingMethod: string | null;
    producerNotes: string | null;
    imageUrl: string | null;
    storeUrl: string | null;
  };
  origin: {
    country: string | null;
    region: string | null;
    farm: string | null;
    producer: string | null;
    altitudeMin: number | null;
    altitudeMax: number | null;
    altitudeLabel: string | null;
  };
  roast: {
    id: string | null;
    date: string | null;
    lotNumber: string | null;
    level: string | null;
  };
  brewing: {
    recommendedMethod: string | null;
    notes: string | null;
  };
  story: {
    roasterStory: string | null;
  };
  stats: {
    totalTastings: number;
    avgRating: number;
    favoriteUsersCount: number;
  };
  tastingNotes: Array<{
    id: string;
    name: string;
    label: string;
    category: string;
  }>;
  logBatchId: string | null;
};

function normalizeAltitudeLabel(input: {
  min?: number | null;
  max?: number | null;
  exact?: string | number | null;
}): string | null {
  const exact = input.exact;
  if (typeof exact === 'string' && exact.trim()) return `${exact.trim()} m`;
  if (typeof exact === 'number') return `${exact} m`;

  const min = input.min ?? null;
  const max = input.max ?? null;
  if (typeof min === 'number' && typeof max === 'number') {
    return `${min}-${max} m`;
  }
  if (typeof min === 'number') {
    return `${min} m`;
  }
  if (typeof max === 'number') {
    return `${max} m`;
  }
  return null;
}

export function normalizeCoffeePageData(
  input: ScanQrResult,
  params: { hash: string }
): NormalizedCoffeePageData {
  const origin = (input.origin ?? {}) as {
    country?: string | null;
    region?: string | null;
    farm?: string | null;
    producer?: string | null;
    altitude_min?: number | null;
    altitude_max?: number | null;
  };

  return {
    source: 'canonical',
    hash: params.hash,
    archived: input.archived,
    roaster: {
      name: input.roaster.name,
      city: input.roaster.city,
      country: input.roaster.country,
      logoUrl: input.roaster.logo_url,
      shortName: input.roaster.roaster_short_name ?? input.roaster.name,
    },
    product: {
      id: input.coffee.id,
      name: input.coffee.name,
      variety: input.coffee.variety,
      varieties: input.coffee.varieties ?? [],
      processingMethod: input.coffee.processing_method,
      producerNotes: input.coffee.producer_notes,
      imageUrl: input.coffee.cover_image_url,
      storeUrl: input.coffee.store_url,
    },
    origin: {
      country: origin.country ?? null,
      region: origin.region ?? null,
      farm: origin.farm ?? null,
      producer: origin.producer ?? null,
      altitudeMin: origin.altitude_min ?? null,
      altitudeMax: origin.altitude_max ?? null,
      altitudeLabel: normalizeAltitudeLabel({
        min: origin.altitude_min,
        max: origin.altitude_max,
      }),
    },
    roast: {
      id: input.batch.id,
      date: input.batch.roast_date,
      lotNumber: input.batch.lot_number,
      level: null,
    },
    brewing: {
      recommendedMethod: null,
      notes: input.batch.brewing_notes,
    },
    story: {
      roasterStory: input.batch.roaster_story,
    },
    stats: {
      totalTastings: input.stats.total_count,
      avgRating: input.stats.avg_rating,
      favoriteUsersCount: input.stats.favorite_user_count,
    },
    tastingNotes: [],
    logBatchId: input.batch.id,
  };
}

export function toCanonicalPublicationFields(
  input: NormalizedCoffeePageData
): CanonicalPublicationFields {
  return {
    coffee: {
      name: input.product.name,
      variety: input.product.variety,
      varieties: input.product.varieties,
      processingMethod: input.product.processingMethod,
      producerNotes: input.product.producerNotes,
      imageUrl: input.product.imageUrl,
      storeUrl: input.product.storeUrl,
    },
    origin: {
      country: input.origin.country,
      region: input.origin.region,
      farm: input.origin.farm,
      producer: input.origin.producer,
      altitudeMin: input.origin.altitudeMin,
      altitudeMax: input.origin.altitudeMax,
      altitudeLabel: input.origin.altitudeLabel,
    },
    batch: {
      id: input.roast.id ?? input.logBatchId,
      lotNumber: input.roast.lotNumber,
      roastDate: input.roast.date,
      brewingNotes: input.brewing.notes,
      roasterStory: input.story.roasterStory,
    },
    qr: {
      hash: input.hash,
    },
  };
}
