import { cn } from "@/lib/utils";

type StepSectionProps = {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

export function StepSection({ step, title, description, children, className }: StepSectionProps) {
  return (
    <section className={cn("page-section", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
          {step}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <div className="pt-2">{children}</div>
    </section>
  );
}

