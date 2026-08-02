import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AccountPlaceholder from '@/components/AccountPlaceholder';
import { authOptions } from '@/lib/auth';

export default async function RespPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return <AccountPlaceholder accountName="RESP" />;
}
