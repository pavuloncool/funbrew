import Link from 'next/link';

import { hubCrudStyles } from '../../../../hub-crud.styles';

type Props = {
  params: Promise<{ id: string; batchId: string }>;
};

export default async function BatchDetailsPage({ params }: Props) {
  const { id, batchId } = await params;

  return (
    <main className={hubCrudStyles.main760}>
      <h1 className={hubCrudStyles.pageHeading}>Batch details</h1>
      <p className={hubCrudStyles.bodyText}>
        <strong className={hubCrudStyles.bodyStrong}>Coffee:</strong> {id}
      </p>
      <p className={hubCrudStyles.bodyText}>
        <strong className={hubCrudStyles.bodyStrong}>Batch:</strong> {batchId}
      </p>
      <p className={hubCrudStyles.batchNote}>
        Generowanie kodów QR dla batchy przeniesiono do flow tagu kawy (strona /tag).
      </p>
      <p>
        <Link href={`/roaster-hub/analytics/${batchId}`} className={hubCrudStyles.actionLink}>
          Batch analytics
        </Link>
      </p>
      <p>
        <Link href={`/roaster-hub/coffees/${id}`} className={hubCrudStyles.actionLink}>
          Back to coffee
        </Link>
      </p>
    </main>
  );
}
