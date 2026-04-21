import { PageContainer } from "@/components/layout/page-container";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <PageContainer>{children}</PageContainer>
    </div>
  );
}

