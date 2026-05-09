"use client";

import { Users } from "lucide-react";
import { WorkersDataTable } from "@/components/workers/WorkersDataTable";

export default function TravailleursPage() {
  return (
    <div className="page-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight leading-tight">Travailleurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez vos travailleurs, consultez leurs performances et contrôlez leurs accès.
          </p>
        </div>
      </div>

      <WorkersDataTable />
    </div>
  );
}