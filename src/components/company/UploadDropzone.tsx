import * as React from "react";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";

export function UploadDropzone({
  label,
  hint,
  className,
  onFiles,
}: {
  label: string;
  hint?: string;
  className?: string;
  onFiles?: (files: FileList) => void;
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-all hover:border-primary/40 hover:bg-primary/5",
        dragging && "border-primary/60 bg-primary/10",
        className,
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles?.(e.dataTransfer.files);
      }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <UploadCloud className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && onFiles?.(e.target.files)}
      />
    </label>
  );
}
