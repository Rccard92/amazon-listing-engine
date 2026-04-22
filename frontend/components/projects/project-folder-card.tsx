"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { it } from "@/lib/i18n/it";
import type { ProjectFolder } from "@/lib/project-folders";

type ProjectFolderCardProps = {
  folder: ProjectFolder;
  onRename?: (folder: ProjectFolder) => void;
  onDelete?: (folder: ProjectFolder) => void;
};

export function ProjectFolderCard({ folder, onRename, onDelete }: ProjectFolderCardProps) {
  return (
    <Card className="border-slate-200/80">
      <CardHeader>
        <CardTitle className="text-base">{folder.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-slate-600">{folder.description || "Nessuna descrizione."}</p>
        <p className="text-xs text-slate-500">
          Elementi: {folder.items_count ?? 0} • Aggiornato: {new Date(folder.updated_at).toLocaleString("it-IT")}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/projects/${folder.id}`}>{it.common.open}</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onRename?.(folder)}>
          {it.common.rename}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete?.(folder)}>
          {it.common.delete}
        </Button>
      </CardFooter>
    </Card>
  );
}

