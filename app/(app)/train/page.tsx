import Link from 'next/link';

export default function TrainPage() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Train</h1>
      <div className="grid gap-4">
        <Link
          href="/train/vigilance"
          className="block border rounded-xl p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold">Vigilance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sustained attention · 5–30 min sessions
          </p>
        </Link>
        <Link
          href="/train/determination"
          className="block border rounded-xl p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold">Determination Test</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-limb reaction · Adaptive pacing · Full aviation battery
          </p>
        </Link>
      </div>
    </main>
  );
}
