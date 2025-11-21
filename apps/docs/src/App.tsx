import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { docs, type ComponentDoc } from "./examples";

function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#\/?/, "");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("slateui-theme", dark ? "dark" : "light");
    } catch {
      /* storage may be unavailable */
    }
  }, [dark]);
  return [dark, setDark] as const;
}

function ThemeToggle() {
  const [dark, setDark] = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      data-testid="theme-toggle"
      onClick={() => setDark(!dark)}
    >
      {dark ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </Button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-edge bg-subtle p-4 text-xs leading-relaxed text-subtle-ink">
      <code>{children}</code>
    </pre>
  );
}

function Home() {
  return (
    <article className="grid max-w-2xl gap-6">
      <div className="grid gap-3">
        <Badge tone="brand" className="w-fit">
          v0.1
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Components you own.</h1>
        <p className="text-lg text-muted-ink">
          slateui is a set of accessible React components that you copy into your project with a
          CLI. No runtime package, no version lock-in: the source lives in your repo and you edit it
          like any other file.
        </p>
      </div>
      <section aria-labelledby="qs" className="grid gap-3">
        <h2 id="qs" className="text-xl font-semibold">
          Quickstart
        </h2>
        <Code>{`npx slateui init\nnpx slateui add button dialog toast\nnpx slateui diff        # see your local edits vs. the registry`}</Code>
      </section>
      <section aria-labelledby="all" className="grid gap-3">
        <h2 id="all" className="text-xl font-semibold">
          {docs.length} components
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {docs.map((d) => (
            <li key={d.slug}>
              <a
                className="block rounded-md border border-edge px-3 py-2 text-sm hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
                href={`#/components/${d.slug}`}
              >
                {d.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function ComponentPage({ doc }: { doc: ComponentDoc }) {
  return (
    <article className="grid gap-8" data-testid={`page-${doc.slug}`}>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{doc.name}</h1>
        <p className="text-muted-ink">{doc.description}</p>
        <Code>{`npx slateui add ${doc.slug}`}</Code>
      </header>
      {doc.examples.map((example) => (
        <section key={example.title} className="grid gap-3" aria-label={example.title}>
          <h2 className="text-lg font-semibold">{example.title}</h2>
          <div className="flex min-h-36 items-center justify-center rounded-xl border border-edge bg-canvas p-8">
            {example.render()}
          </div>
        </section>
      ))}
      <section className="grid gap-3" aria-label="Usage">
        <h2 className="text-lg font-semibold">Usage</h2>
        <Code>{doc.usage}</Code>
      </section>
    </article>
  );
}

export function App() {
  const route = useHashRoute();
  const slug = route.startsWith("components/") ? route.slice("components/".length) : null;
  const doc = slug ? docs.find((d) => d.slug === slug) : undefined;

  useEffect(() => {
    document.title = doc ? `${doc.name} · slateui` : "slateui";
    window.scrollTo(0, 0);
  }, [doc]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-canvas text-ink">
        <header className="sticky top-0 z-40 border-b border-edge bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
            <a href="#/" className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center rounded-md bg-brand text-xs text-brand-ink"
              >
                s
              </span>
              slateui
            </a>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-ink">Copy-paste accessible React components</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="mx-auto flex max-w-6xl gap-8 px-4">
          <nav
            aria-label="Components"
            className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-48 shrink-0 overflow-y-auto py-6 md:block"
          >
            <ul className="grid gap-0.5">
              <li>
                <a
                  href="#/"
                  aria-current={!doc ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-2 py-1 text-sm text-muted-ink hover:text-ink",
                    !doc && "bg-subtle font-medium text-ink",
                  )}
                >
                  Introduction
                </a>
              </li>
              {docs.map((d) => (
                <li key={d.slug}>
                  <a
                    href={`#/components/${d.slug}`}
                    aria-current={doc?.slug === d.slug ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1 text-sm text-muted-ink hover:text-ink",
                      doc?.slug === d.slug && "bg-subtle font-medium text-ink",
                    )}
                  >
                    {d.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <main className="min-w-0 flex-1 py-10">
            {doc ? (
              <ComponentPage doc={doc} />
            ) : slug ? (
              <p role="alert">Unknown component “{slug}”.</p>
            ) : (
              <Home />
            )}
          </main>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
