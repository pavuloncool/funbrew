import type { ScanQrResult } from '../hooks/useCoffeePage';

export type NormalizedCoffeePageData = {
  source: 'canonical' | 'tag';
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
    processingMethod: string | null;
    producerNotes: string | null;
    imageUrl: string | null;
  };
  origin: {
    country: string | null;
    region: string | null;
    farm: string | null;
    producer: string | null;
    altitudeLabel: string | null;
  };
  roast: {
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
  };
  tastingNotes: Array<{
    id: string;
    name: string;
    label: string;
    category: string;
  }>;
  logBatchId: string | null;
};

function displayTagName(tag: {
  bean_origin_tradename: string;
  bean_origin_farm: string;
  id: string;
}): string {
  const tradename = tag.bean_origin_tradename.trim();
  if (tradename) return tradename;
  const farm = tag.bean_origin_farm.trim();
  if (farm) return farm;
  return `Kawa ${tag.id.slice(0, 8)}`;
}

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
  if (input.kind === 'batch') {
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
        shortName: input.roaster.name,
      },
      product: {
        id: input.coffee.id,
        name: input.coffee.name,
        variety: input.coffee.variety,
        processingMethod: input.coffee.processing_method,
        producerNotes: input.coffee.producer_notes,
        imageUrl: input.coffee.cover_image_url,
      },
      origin: {
        country: origin.country ?? null,
        region: origin.region ?? null,
        farm: origin.farm ?? null,
        producer: origin.producer ?? null,
        altitudeLabel: normalizeAltitudeLabel({
          min: origin.altitude_min,
          max: origin.altitude_max,
        }),
      },
      roast: {
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
      },
      tastingNotes: [],
      logBatchId: input.batch.id,
    };
  }

  const tag = input.tag;
  return {
    source: 'tag',
    hash: params.hash,
    archived: false,
    roaster: {
      name: tag.roaster_short_name || null,
      city: null,
      country: null,
      logoUrl: null,
      shortName: tag.roaster_short_name || null,
    },
    product: {
      id: tag.id,
      name: displayTagName(tag),
      variety:
        [tag.bean_type, tag.bean_varietal_main, tag.bean_varietal_extra]
          .filter(Boolean)
          .join(' · ') || null,
      processingMethod: tag.bean_processing || null,
      producerNotes: tag.bean_origin_tradename || null,
      imageUrl: tag.img_coffee_label || null,
    },
    origin: {
      country: tag.bean_origin_country || null,
      region: tag.bean_origin_region || null,
      farm: tag.bean_origin_farm || null,
      producer: null,
      altitudeLabel: normalizeAltitudeLabel({
        exact:
          tag.bean_origin_height == null ? null : String(tag.bean_origin_height),
      }),
    },
    roast: {
      date: tag.bean_roast_date || null,
      lotNumber: null,
      level: tag.bean_roast_level || null,
    },
    brewing: {
      recommendedMethod: tag.brew_method || null,
      notes: null,
    },
    story: {
      roasterStory: null,
    },
    stats: {
      totalTastings: 0,
      avgRating: 0,
    },
    tastingNotes: input.tasting_notes ?? [],
    logBatchId: null,
  };
}
