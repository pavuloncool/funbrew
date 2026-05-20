import LoginPageClient from './LoginPageClient';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  return (
    <LoginPageClient
      nextParam={firstParam(resolvedSearchParams.next)}
      reason={firstParam(resolvedSearchParams.reason)}
    />
  );
}
