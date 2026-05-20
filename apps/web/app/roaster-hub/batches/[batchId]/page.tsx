import { BatchPublicationEditor } from '@/src/components/roaster-hub/BatchPublicationEditor';

type Props = {
  params: Promise<{ batchId: string }>;
};

export default async function BatchPublicationDetailPage({ params }: Props) {
  const { batchId } = await params;
  return <BatchPublicationEditor mode="edit" batchId={batchId} />;
}
