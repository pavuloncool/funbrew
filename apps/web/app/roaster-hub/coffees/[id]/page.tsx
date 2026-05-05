import { CoffeeEditor } from '@/src/components/roaster-hub/CoffeeEditor';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CoffeeDetailsPage({ params }: Props) {
  const { id } = await params;
  return <CoffeeEditor mode="edit" coffeeId={id} />;
}
