// components/workers/InfoRow.tsx
import { Skeleton } from "@/components/ui/skeleton";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  isLoading?: boolean;
}

export function InfoRow({ icon: Icon, label, value, isLoading }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-b-0">
      <div className="h-8 w-8 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        {isLoading ? (
          <Skeleton className="h-4 w-32 mt-0.5" />
        ) : value ? (
          <p className="text-sm font-medium truncate leading-tight">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground/40 italic">—</p>
        )}
      </div>
    </div>
  );
}