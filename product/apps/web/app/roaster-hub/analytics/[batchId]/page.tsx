import { BatchAnalyticsDetail } from '@/src/components/roaster-hub/BatchAnalyticsDetail';

type Props = {
  params: Promise<{ batchId: string }>;
};

export default async function BatchAnalyticsDetailPage({ params }: Props) {
  const { batchId } = await params;
  return <BatchAnalyticsDetail batchId={batchId} />;
}
