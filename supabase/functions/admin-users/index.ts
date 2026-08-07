/**
 * admin-users — admin-only user management via service role.
 * create: confirmed auth user + profile with a temp password.
 * delete: hard-deletes the auth user (children removed via FK cascade).
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "npm:bcryptjs@2.4.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return out;
}

async function isAdminUser(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const uid = decodeJwtPayload(token)?.sub;
  if (typeof uid !== "string" || !uid) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();
  return data?.role === "admin";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    if (!(await isAdminUser(req))) {
      return json(403, { error: "Admin access required" });
    }

    const body = await req.json();
    const action = body?.action;

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const role = body.role === "admin" ? "admin" : "user";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(400, { error: "A valid email is required." });
      }

      const displayName = name || email.split("@")[0];
      const tempPassword = generatePassword();

      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: displayName },
        });
      if (createError) {
        return json(400, { error: createError.message });
      }
      const userId = created?.user?.id;
      if (!userId) {
        return json(400, { error: "User creation failed." });
      }

      const hash = bcrypt.hashSync(tempPassword, 10);
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email,
          name: displayName,
          role,
          password: hash,
        },
        { onConflict: "id" },
      );
      if (profileError) {
        await supabase.auth.admin.deleteUser(userId).catch(() => {});
        return json(400, { error: profileError.message });
      }

      return json(200, {
        id: userId,
        email,
        name: displayName,
        role,
        tempPassword,
      });
    }

    if (action === "delete") {
      const userId = String(body.id || "");
      if (!userId) {
        return json(400, { error: "User id is required." });
      }

      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        return json(400, { error: error.message });
      }
      return json(200, { ok: true, id: userId });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (e) {
    console.error("[admin-users]", e);
    return json(500, { error: (e as Error).message });
  }
});
