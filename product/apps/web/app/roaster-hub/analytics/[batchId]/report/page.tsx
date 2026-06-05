import { BatchAnalyticsDetail } from '@/src/components/roaster-hub/BatchAnalyticsDetail';

type Props = {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSingle(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function readNullableNumber(value: string | string[] | undefined): number | null {
  const single = readSingle(value);
  if (!single) return null;
  const parsed = Number(single);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function BatchAnalyticsReportPage({ params, searchParams }: Props) {
  const { batchId } = await params;
  const filters = await searchParams;

  return (
    <BatchAnalyticsDetail
      batchId={batchId}
      reportMode
      initialFilters={{
        brewMethodId: readSingle(filters.brewMethodId) || null,
        startDate: readSingle(filters.startDate),
        endDate: readSingle(filters.endDate),
        minRating: readNullableNumber(filters.minRating),
        maxRating: readNullableNumber(filters.maxRating),
        feedbackQuery: readSingle(filters.feedbackQuery),
      }}
    />
  );
}
