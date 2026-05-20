import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ batchId: string }>;
};

export default async function LegacyBatchDetailsRedirectPage({ params }: Props) {
  const { batchId } = await params;
  redirect(`/roaster-hub/batches/${batchId}`);
}
