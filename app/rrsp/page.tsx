import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import RegisteredAccountSummary from '@/components/RegisteredAccountSummary';
import { authOptions } from '@/lib/auth';
import { AJ_RRSP_VALUE_CAD, SHEILA_RRSP_VALUE_CAD } from '@/lib/constants';

export default async function RrspPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return (
    <RegisteredAccountSummary
      accountName="RRSP"
      balances={[
        { owner: 'AJ', value: AJ_RRSP_VALUE_CAD },
        { owner: 'Sheila', value: SHEILA_RRSP_VALUE_CAD },
      ]}
    />
  );
}
