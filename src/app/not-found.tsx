import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Lapa nav atrasta</h1>
      <p className="mt-3 text-muted">Iespējams, saite ir novecojusi vai tajā ir kļūda.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Uz sākumu</Link>
        <Link href="/jautajumi" className="btn-secondary">Jautājumi</Link>
      </div>
    </div>
  );
}
