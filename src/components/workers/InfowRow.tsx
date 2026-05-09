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
    <div className="flex items-center gap-3 py-2.5">
      <div className="rose-glow-icon h-8 w-8 shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-4 w-32 mt-0.5" />
        ) : value ? (
          <p className="text-sm font-medium truncate">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">—</p>
        )}
      </div>
    </div>
  );
}