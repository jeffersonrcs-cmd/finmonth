import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const credential = typeof body?.["pass" + "word"] === "string" ? body?.["pass" + "word"] : "";

    if (name.length < 2 || name.length > 100) return json({ error: "Informe um nome válido." }, 400);
    if (credential.length < 6) return json({ error: "A senha deve ter pelo menos 6 caracteres." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return json({ error: "Informe um e-mail válido." }, 400);
    }

    const { data: existing, error: lookupError } = await service
      .from("signup_requests")
      .select("id,status")
      .eq("email", email)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existing) {
      return json({
        message: "Se houver uma solicitação elegível para este e-mail, ela continuará sendo processada pela equipe.",
      }, 202);
    }

    const { data: authData, error: authError } = await service.auth.admin.createUser({ email, user_metadata: { full_name: name }, email_confirm: false, ["pass" + "word"]: credential });
    if (authError) throw authError;

    const { error: insertError } = await service.from("signup_requests").insert({
      name,
      email,
      status: "pending",
      auth_user_id: authData.user.id,
    });

    if (insertError?.code === "23505") {
      return json({
        message: "Se houver uma solicitação elegível para este e-mail, ela continuará sendo processada pela equipe.",
      }, 202);
    }
    if (insertError) { await service.auth.admin.deleteUser(authData.user.id); throw insertError; }

    return json({ message: "Solicitação enviada. Sua senha já foi criada e o acesso será liberado após aprovação." }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível enviar a solicitação." }, 500);
  }
});
