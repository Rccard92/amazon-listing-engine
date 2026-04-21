"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  title?: string;
  description?: string;
  accept?: string;
  onFilesSelected?: (files: File[]) => void;
};

export function UploadDropzone({
  title = "Carica file Helium10",
  description = "Trascina il CSV qui oppure clicca per selezionarlo.",
  accept = ".csv,text/csv",
  onFilesSelected,
}: UploadDropzoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const applyFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setFileNames(fileList.map((f) => f.name));
    onFilesSelected?.(fileList);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        className={cn(
          "w-full rounded-3xl border border-dashed p-8 text-left transition sm:p-10",
          isOver
            ? "border-slate-900/40 bg-slate-100/80"
            : "border-slate-300 bg-white/90 hover:bg-slate-50",
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsOver(false);
          applyFiles(event.dataTransfer.files);
        }}
      >
        <div className="mx-auto max-w-md space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path d="M12 3v12" />
              <path d="m7 8 5-5 5 5" />
              <path d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
            </svg>
          </div>
          <h4 className="text-base font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(event) => applyFiles(event.target.files)}
      />

      {fileNames.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="mb-2 font-medium text-slate-800">File selezionati</p>
          <ul className="space-y-1">
            {fileNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-500">
          Nessun file caricato. Supportato formato CSV (Helium10 export).
        </div>
      )}
    </div>
  );
}

