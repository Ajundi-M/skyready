import Link from 'next/link';

export default async function SignupConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params?.email ?? '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">SkyReady</h1>
          <p className="text-sm text-muted-foreground">Almost there!</p>
        </div>

        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          Check your email — we sent a confirmation link to{' '}
          <span className="font-medium">{email}</span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already confirmed?{' '}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
