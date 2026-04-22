import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { it } from "@/lib/i18n/it";

const ACCENTS = [
  "from-violet-500/15 to-fuchsia-500/10",
  "from-sky-500/15 to-indigo-500/10",
  "from-amber-500/15 to-orange-500/10",
] as const;

const HREFS = ["/new-listing", "/improve", "/competitor"] as const;

export function WorkflowGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {it.workflows.cards.map((w, i) => (
        <Card key={HREFS[i]} className="group relative overflow-hidden border-slate-200/70">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ACCENTS[i]} opacity-80 transition group-hover:opacity-100`}
            aria-hidden
          />
          <CardHeader className="relative">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{w.title}</CardTitle>
              <Badge className="border border-slate-200/60 bg-white/70 text-slate-800">{w.badge}</Badge>
            </div>
            <CardDescription className="relative text-slate-600">{w.description}</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{it.common.nextStep}</p>
            <p className="mt-1 text-sm text-slate-700">{w.nextHint}</p>
          </CardContent>
          <CardFooter className="relative">
            <Button asChild variant="primary" className="w-full">
              <Link href={HREFS[i]}>{w.cta}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
