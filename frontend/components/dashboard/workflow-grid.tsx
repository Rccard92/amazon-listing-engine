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

type Workflow = {
  title: string;
  description: string;
  badge: string;
  href: string;
  accent: string;
};

const workflows: Workflow[] = [
  {
    title: "New Listing",
    description:
      "Crea una nuova scheda prodotto da input strutturati e parole chiave manuali o CSV Helium10.",
    badge: "Generation",
    href: "/new-listing",
    accent: "from-violet-500/15 to-fuchsia-500/10",
  },
  {
    title: "Improve Existing Listing",
    description:
      "Incolla un URL Amazon e ottieni suggerimenti guidati per migliorare titolo, bullet e backend terms.",
    badge: "Optimization",
    href: "/improve",
    accent: "from-sky-500/15 to-indigo-500/10",
  },
  {
    title: "Build From Competitor",
    description:
      "Parti da una pagina concorrente per creare un listing differenziato con positioning più chiaro.",
    badge: "Competitor",
    href: "/competitor",
    accent: "from-amber-500/15 to-orange-500/10",
  },
];

export function WorkflowGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {workflows.map((w) => (
        <Card key={w.href} className="group relative overflow-hidden border-slate-200/70">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${w.accent} opacity-80 transition group-hover:opacity-100`}
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
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prossimo step</p>
            <p className="mt-1 text-sm text-slate-700">Flusso guidato in 3 sezioni con campi e upload dove necessario.</p>
          </CardContent>
          <CardFooter className="relative">
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href={w.href}>Apri workflow</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

