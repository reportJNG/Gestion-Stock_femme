"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

export interface Worker {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "viewer" | "worker";
  is_active: boolean;
  commission_rate: number | null;
  total_sales_count: number | null;
  total_revenue: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerFormData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  commission_rate?: number;
  is_active?: boolean;
}

export interface WorkerUpdateData {
  id: string;
  full_name?: string;
  phone?: string;
  commission_rate?: number;
  is_active?: boolean;
  email?: string;
}

export interface WorkerSalesSummary {
  total_sales: number;
  revenue_ht: number;
  revenue_ttc: number;
  today_sales: number;
  today_revenue: number;
  week_sales: number;
  month_sales: number;
}

export interface WorkerSale {
  id: string;
  sale_number: string;
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  items_count?: number;
  sale_items?: { count: number }[] | null;
}

// ─── Supabase Client ─────────────────────────────────────

function getSupabase() {
  return createClient();
}

// ─── Query Keys ──────────────────────────────────────────

export const workerKeys = {
  all: ["workers"] as const,
  lists: () => [...workerKeys.all, "list"] as const,
  list: (filters: { search?: string; activeOnly?: boolean }) =>
    [...workerKeys.lists(), filters] as const,
  details: () => [...workerKeys.all, "detail"] as const,
  detail: (id: string) => [...workerKeys.details(), id] as const,
  sales: (id: string) => [...workerKeys.detail(id), "sales"] as const,
  salesSummary: (id: string) =>
    [...workerKeys.detail(id), "sales-summary"] as const,
};

// ─── Helpers ─────────────────────────────────────────────

function startOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString();
}

function startOfMonth(date: Date): string {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── Fetch Workers ───────────────────────────────────────

async function fetchWorkers(filters?: {
  search?: string;
  activeOnly?: boolean;
}): Promise<Worker[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "worker")
    .order("created_at", { ascending: false });

  if (filters?.activeOnly) query = query.eq("is_active", true);
  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Worker[]) || [];
}

// ─── Fetch Single Worker ─────────────────────────────────

async function fetchWorker(id: string): Promise<Worker | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "worker")
    .single();
  if (error) throw new Error(error.message);
  return data as Worker | null;
}

// ─── Fetch Worker Sales Summary ──────────────────────────

async function fetchWorkerSalesSummary(workerId: string): Promise<WorkerSalesSummary> {
  const supabase = getSupabase();
  const now = new Date();
  const todayIso = startOfDay(now);
  const weekIso = startOfWeek(now);
  const monthIso = startOfMonth(now);

  const { data: allSales, error } = await supabase
    .from("sales")
    .select("*")
    .eq("sold_by", workerId);

  if (error) throw new Error(error.message);

  const sales = allSales || [];
  let revenue_ht = 0,
    revenue_ttc = 0,
    today_sales = 0,
    today_revenue = 0,
    week_sales = 0,
    month_sales = 0;

  for (const s of sales) {
    const createdAt = s.created_at;
    revenue_ht += s.total_ht || 0;
    revenue_ttc += s.total_ttc || 0;
    if (createdAt >= todayIso) {
      today_sales++;
      today_revenue += s.total_ttc || 0;
    }
    if (createdAt >= weekIso) week_sales++;
    if (createdAt >= monthIso) month_sales++;
  }

  return {
    total_sales: sales.length,
    revenue_ht,
    revenue_ttc,
    today_sales,
    today_revenue,
    week_sales,
    month_sales,
  };
}

// ─── Fetch Worker Sales ──────────────────────────────────

async function fetchWorkerSales(
  workerId: string,
  options?: { from?: string; to?: string; limit?: number; offset?: number }
): Promise<{ sales: WorkerSale[]; count: number }> {
  const supabase = getSupabase();

  let query = supabase
    .from("sales")
    .select("*, sale_items(count)", { count: "exact" })
    .eq("sold_by", workerId)
    .order("created_at", { ascending: false });

  if (options?.from) query = query.gte("created_at", options.from);
  if (options?.to) query = query.lte("created_at", options.to);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset != null && options.offset > 0)
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const sales = (data || []).map((sale: any) => ({
    ...sale,
    items_count: sale.sale_items?.[0]?.count || 0,
  }));

  return { sales: sales as WorkerSale[], count: count || 0 };
}

// ─── Create Worker ───────────────────────────────────────
// Uses a server-side API route with the service_role key so the browser
// session is NEVER swapped — no crash, no redirect, no auth state change.
async function createWorker(formData: WorkerFormData): Promise<Worker> {
  const res = await fetch("/api/workers/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || "Erreur lors de la création du travailleur");
  }

  return json.worker as Worker;
}

// ─── Update Worker ───────────────────────────────────────

async function updateWorker(data: WorkerUpdateData): Promise<Worker> {
  const supabase = getSupabase();
  const { id, ...updates } = data;

  const { data: profileData, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return profileData as Worker;
}

// ─── Delete Worker ───────────────────────────────────────
// Goes through API route so both auth.users AND profiles are deleted.
// Deleting only from profiles leaves a ghost user who can still log in.
async function deleteWorker(id: string): Promise<void> {
  const res = await fetch("/api/workers/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Erreur lors de la suppression");
}

// ─── Toggle Worker Active Status ─────────────────────────

async function toggleWorkerActive(id: string, isActive: boolean): Promise<Worker> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Worker;
}

// ═════════════════════════════════════════════════════════
//  TANSTACK QUERY HOOKS
// ═════════════════════════════════════════════════════════

export function useWorkers(filters?: { search?: string; activeOnly?: boolean }) {
  return useQuery({
    queryKey: workerKeys.list(filters || {}),
    queryFn: () => fetchWorkers(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: workerKeys.detail(id),
    queryFn: () => fetchWorker(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useWorkerSalesSummary(workerId: string) {
  return useQuery({
    queryKey: workerKeys.salesSummary(workerId),
    queryFn: () => fetchWorkerSalesSummary(workerId),
    enabled: !!workerId,
    staleTime: 1000 * 60,
  });
}

export function useWorkerSales(
  workerId: string,
  options?: { from?: string; to?: string; limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: [...workerKeys.sales(workerId), options || {}],
    queryFn: () => fetchWorkerSales(workerId, options),
    enabled: !!workerId,
    staleTime: 1000 * 60,
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      toast.success("Travailleur ajouté avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorker,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(data.id) });
      toast.success("Travailleur mis à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      toast.success("Travailleur supprimé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });
}

export function useToggleWorkerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleWorkerActive(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(data.id) });
      toast.success(data.is_active ? "Travailleur activé" : "Travailleur désactivé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur");
    },
  });
}