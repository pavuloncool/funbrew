import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ batchId: string }>;
};

export default async function LegacyBatchAnalyticsRedirectPage({ params }: Props) {
  const { batchId } = await params;
  redirect(`/roaster-hub/batches/${batchId}#analytics`);
}
