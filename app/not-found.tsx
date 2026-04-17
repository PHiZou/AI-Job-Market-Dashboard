import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl font-bold text-slate-900 dark:text-slate-100">404</div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        That page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← Back to dashboard
      </Link>
    </main>
  );
}
