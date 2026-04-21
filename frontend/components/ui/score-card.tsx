import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScoreCardProps = {
  title: string;
  score: number;
  delta?: string;
  description?: string;
};

export function ScoreCard({ title, score, delta, description }: ScoreCardProps) {
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <Card className="border-slate-200/75">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {delta ? <Badge variant="info">{delta}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight text-slate-900">{safeScore}</span>
          <span className="pb-1 text-sm text-slate-500">su 100</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${safeScore}%` }}
          />
        </div>
        <p className="text-sm text-slate-600">{description ?? "Nessun dato disponibile."}</p>
      </CardContent>
    </Card>
  );
}

