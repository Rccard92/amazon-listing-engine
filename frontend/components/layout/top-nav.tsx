import Link from "next/link";

import { Button } from "@/components/ui/button";
import { it } from "@/lib/i18n/it";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: it.nav.home },
  { href: "/competitor", label: it.nav.competitor },
  { href: "/listing-generazione", label: it.nav.listingGeneration },
  { href: "/improve", label: it.nav.improve },
  { href: "/new-listing", label: it.nav.newListing },
  { href: "/history", label: it.nav.history },
  { href: "/projects", label: it.nav.projects },
];

type TopNavProps = {
  className?: string;
};

export function TopNav({ className }: TopNavProps) {
  return (
    <header className={cn("sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl", className)}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs text-white">
            {it.brand.short}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate">{it.brand.name}</span>
            <span className="hidden truncate text-[11px] font-normal text-slate-500 sm:block">
              {it.brand.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl bg-slate-100/80 p-1 md:flex" aria-label="Navigazione principale">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button size="sm" variant="secondary" asChild>
          <Link href="/competitor">{it.nav.cta}</Link>
        </Button>
      </div>
    </header>
  );
}
