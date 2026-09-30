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
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Não autenticado." }, 401);
  const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false }, global: { headers: { Authorization: authHeader } },
  });
  try {
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Sessão inválida." }, 401);
    const { data: admin, error: adminError } = await service.from("admin_users").select("user_id")
      .eq("user_id", userData.user.id).maybeSingle();
    if (adminError) throw adminError;
    if (!admin) return json({ error: "Acesso administrativo necessário." }, 403);
    const body = await req.json();
    if (body?.action === "list") {
      const { data: requests, error } = await service.from("signup_requests")
        .select("id,name,email,status,created_at").in("status", ["pending", "approved"]).order("created_at", { ascending: true });
      if (error) throw error;
      const { data: usersData, error: usersError } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      const usersByEmail = new Map(
        (usersData.users ?? []).map((user) => [
          (user.email ?? "").toLowerCase(),
          Boolean(user.email_confirmed_at || user.confirmed_at),
        ]),
      );
      return json({
        requests: (requests ?? []).map((request) => ({
          ...request,
          email_confirmed: usersByEmail.get(request.email.toLowerCase()) ?? false,
        })),
      });
    }
    const requestId = typeof body?.requestId === "string" ? body.requestId : "";
    const action = body?.action;
    if (!requestId || !["approve", "reject", "resend"].includes(action)) return json({ error: "Ação inválida." }, 400);
    const { data: request, error: requestError } = await service.from("signup_requests")
      .select("id,name,email,status").eq("id", requestId).maybeSingle();
    if (requestError) throw requestError;
    if (!request) return json({ error: "Solicitação não encontrada." }, 404);
    if (action === "resend") {
      if (request.status !== "approved") return json({ error: "A solicitação ainda não foi aprovada." }, 409);
      const { data: usersData, error: usersError } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) throw usersError;
      const authUser = (usersData.users ?? []).find(
        (user) => (user.email ?? "").toLowerCase() === request.email.toLowerCase(),
      );
      if (authUser?.email_confirmed_at || authUser?.confirmed_at) {
        return json({ error: "Este usuário já confirmou o cadastro e não precisa de novo convite." }, 409);
      }
      if (authUser?.id) {
        const { error: deleteError } = await service.auth.admin.deleteUser(authUser.id);
        if (deleteError) throw deleteError;
      }
      const { error: inviteError } = await service.auth.admin.inviteUserByEmail(request.email, {
        data: { full_name: request.name },
        redirectTo: "https://finmonth.github.io/confirmar-email",
      });
      if (inviteError) return json({ error: `Não foi possível reenviar o convite: ${inviteError.message}` }, 400);
      return json({ message: "Novo link para criar senha enviado por e-mail." });
    }

    if (request.status !== "pending") return json({ error: "Solicitação já processada." }, 409);
    if (action === "reject") {
      const { error } = await service.from("signup_requests").update({
        status: "rejected", processed_at: new Date().toISOString(), processed_by: userData.user.id,
      }).eq("id", requestId).eq("status", "pending");
      if (error) throw error;
      return json({ message: "Solicitação rejeitada." });
    }
    const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(request.email, {
      data: { full_name: request.name }, redirectTo: "https://finmonth.github.io/confirmar-email",
    });
    if (inviteError) {
      if (invited?.user?.id) {
        const { error: cleanupError } = await service.auth.admin.deleteUser(invited.user.id);
        if (cleanupError) console.error("Falha ao limpar usuário criado pelo convite:", cleanupError);
      }
      return json({ error: `Não foi possível enviar o convite por e-mail: ${inviteError.message}` }, 400);
    }
    const { error: updateError } = await service.from("signup_requests").update({
      status: "approved", processed_at: new Date().toISOString(), processed_by: userData.user.id,
    }).eq("id", requestId).eq("status", "pending");
    if (updateError) {
      if (invited?.user?.id) await service.auth.admin.deleteUser(invited.user.id);
      throw updateError;
    }
    return json({ message: "Solicitação aprovada. O convite foi enviado por e-mail." });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível processar a solicitação." }, 500);
  }
});
