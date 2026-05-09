import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase env vars");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, key, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value, ...options } as any); } catch {}
      },
      remove(name: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value: "", ...options } as any); } catch {}
      },
    },
  });
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Verify caller is an authenticated admin
    const serverSupabase = getServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: callerProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 2. Parse body safely
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const { id } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // 3. Confirm target is a worker (never allow deleting admins this way)
    const { data: targetProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Travailleur introuvable" }, { status: 404 });
    }

    if (targetProfile.role !== "worker") {
      return NextResponse.json(
        { error: "Impossible de supprimer un compte non-travailleur" },
        { status: 403 }
      );
    }

    // 4. Delete auth user — profiles row is removed by ON DELETE CASCADE
    const admin = getAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(id);

    if (deleteError) {
      // If auth user doesn't exist, still clean up the profiles row
      if (deleteError.message?.includes("not found") || deleteError.status === 404) {
        await admin.from("profiles").delete().eq("id", id);
        return NextResponse.json({ success: true }, { status: 200 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("[/api/workers/delete]", err);
    return NextResponse.json(
      { error: err?.message || "Erreur serveur interne" },
      { status: 500 }
    );
  }
}