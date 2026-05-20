import LegacyCoffeeDetailsRedirectPageClient from './LegacyCoffeeDetailsRedirectPageClient';

type LegacyCoffeeDetailsRedirectPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export default async function LegacyCoffeeDetailsRedirectPage({
  params,
  searchParams,
}: LegacyCoffeeDetailsRedirectPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <LegacyCoffeeDetailsRedirectPageClient
      coffeeId={id}
      batchId={firstParam(resolvedSearchParams.batch)}
    />
  );
}
