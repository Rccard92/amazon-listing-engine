import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/new-listing", label: "New Listing" },
  { href: "/improve", label: "Improve Existing" },
  { href: "/competitor", label: "From Competitor" },
];

type TopNavProps = {
  className?: string;
};

export function TopNav({ className }: TopNavProps) {
  return (
    <header className={cn("sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl", className)}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs text-white">
            ALE
          </span>
          Amazon Listing Engine
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl bg-slate-100/80 p-1 md:flex">
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
          <Link href="/new-listing">Start</Link>
        </Button>
      </div>
    </header>
  );
}

