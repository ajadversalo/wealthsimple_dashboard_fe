import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import RegisteredAccountSummary from '@/components/RegisteredAccountSummary';
import { authOptions } from '@/lib/auth';
import { AJ_TFSA_VALUE_CAD, SHEILA_TFSA_VALUE_CAD } from '@/lib/constants';

export default async function TfsaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return (
    <RegisteredAccountSummary
      accountName="TFSA"
      balances={[
        { owner: 'AJ', value: AJ_TFSA_VALUE_CAD },
        { owner: 'Sheila', value: SHEILA_TFSA_VALUE_CAD },
      ]}
    />
  );
}
