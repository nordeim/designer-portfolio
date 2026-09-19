import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-screen grid place-items-center bg-background px-6" aria-label="Page not found">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="label-mono text-muted-foreground">404</p>
        <h1 className="font-body text-5xl md:text-7xl font-light tracking-tight text-foreground">Page Not Found</h1>
        <p className="font-body text-sm text-muted-foreground max-w-sm">
          The page you are looking for could not be found in this application.
        </p>
        <Link
          href="/"
          className="label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          GO HOME →
        </Link>
      </div>
    </section>
  );
}
