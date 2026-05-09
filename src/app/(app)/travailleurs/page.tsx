"use client";

import { Users } from "lucide-react";
import { WorkersDataTable } from "@/components/workers/WorkersDataTable";

export default function TravailleursPage() {
  return (
    <div className="page-shell max-w-7xl mx-auto">
      <div className="rose-page-hero">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="rose-glow-icon h-10 w-10">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Travailleurs</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Gérez vos travailleurs, consultez leurs performances de vente et contrôlez leurs accès.
            </p>
          </div>
        </div>
      </div>
      <WorkersDataTable />
    </div>
  );
}