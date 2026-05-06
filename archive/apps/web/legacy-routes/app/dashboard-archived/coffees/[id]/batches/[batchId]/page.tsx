import Link from 'next/link';

type Props = {
  params: Promise<{ id: string; batchId: string }>;
};

export default async function BatchDetailsPage({ params }: Props) {
  const { id, batchId } = await params;

  return (
    <main style={{ maxWidth: 760, margin: '30px auto', fontFamily: 'system-ui' }}>
      <h1>Batch details</h1>
      <p>
        <strong>Coffee:</strong> {id}
      </p>
      <p>
        <strong>Batch:</strong> {batchId}
      </p>
      <p style={{ marginTop: 12, color: '#444' }}>
        Generowanie kodów QR dla batchy przeniesiono do flow tagu kawy (strona /tag).
      </p>
      <p>
        <Link href={`/dashboard/analytics/${batchId}`}>Batch analytics</Link>
      </p>
      <p>
        <Link href={`/dashboard/coffees/${id}`}>Back to coffee</Link>
      </p>
    </main>
  );
}
