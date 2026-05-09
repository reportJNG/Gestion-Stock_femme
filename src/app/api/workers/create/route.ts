import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  }
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

export async function POST(req: NextRequest) {
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

    // 2. Parse & validate body
    const body = await req.json();
    const { email, password, full_name, phone, commission_rate, is_active } = body ?? {};

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom complet sont requis" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // 3. Create auth user via admin API (never touches browser session)
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "worker" },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 4. Wait for the handle_new_user trigger to create the profile row
    await new Promise((r) => setTimeout(r, 1000));

    // 5. UPDATE (not upsert) the existing profile row the trigger created
    //    with the extra worker fields
    const { data: profile, error: updateError } = await admin
      .from("profiles")
      .update({
        full_name,
        role: "worker",
        phone: phone || null,
        commission_rate: commission_rate ?? 0,
        is_active: is_active ?? true,
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      // Profile update failed — clean up the auth user
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Impossible de configurer le profil: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ worker: profile }, { status: 201 });

  } catch (err: any) {
    console.error("[/api/workers/create]", err);
    return NextResponse.json(
      { error: err?.message || "Erreur serveur interne" },
      { status: 500 }
    );
  }
}