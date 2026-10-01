import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const createInvite = async (
  service: ReturnType<typeof createClient>,
  email: string,
  name: string,
) =>
  service.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: INVITE_REDIRECT,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Não autenticado." }, 401);

  const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
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

      const usersByEmail = new Map((usersData.users ?? []).map((user) => [
        (user.email ?? "").toLowerCase(),
        Boolean(user.email_confirmed_at || user.confirmed_at),
      ]));

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

    const { data: request, error: requestError } = await service
      .from("signup_requests")
      .select("id,name,email,status,auth_user_id")
      .eq("id", requestId)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!request) return json({ error: "Solicitação não encontrada." }, 404);

    const processedAt = new Date().toISOString();

    if (action === "reject") {
      if (request.status !== "pending") return json({ error: "Solicitação já processada." }, 409);
      const { data: rejected, error } = await service.from("signup_requests").update({
        status: "rejected", processed_at: processedAt, processed_by: userData.user.id,
      }).eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
      if (error) throw error;
      if (!rejected) return json({ error: "Esta solicitação acabou de ser processada por outro administrador." }, 409);
      if (request.auth_user_id) {
        const { error: deleteError } = await service.auth.admin.deleteUser(request.auth_user_id);
        if (deleteError) console.error("Falha ao remover usuário rejeitado:", deleteError);
      }
      return json({ message: "Solicitação rejeitada." });
    }

    if (action === "resend") {
      if (request.status !== "approved") return json({ error: "A solicitação precisa estar aprovada." }, 409);
      return json({ message: "O cadastro já está aprovado. O usuário pode entrar usando a senha criada durante a solicitação." });
    }

    if (request.status !== "pending") return json({ error: "Solicitação já processada." }, 409);
    if (!request.auth_user_id) return json({ error: "Solicitação sem usuário de autenticação associado." }, 409);

    const { data: reserved, error: reserveError } = await service.from("signup_requests").update({
      status: "approved", processed_at: processedAt, processed_by: userData.user.id,
    }).eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
    if (reserveError) throw reserveError;
    if (!reserved) return json({ error: "Esta solicitação acabou de ser processada por outro administrador." }, 409);

    const { error: confirmError } = await service.auth.admin.updateUserById(request.auth_user_id, { email_confirm: true });
    if (confirmError) {
      await service.from("signup_requests").update({ status: "pending", processed_at: null, processed_by: null }).eq("id", requestId).eq("status", "approved");
      throw confirmError;
    }
    return json({ message: "Cadastro aprovado. O acesso foi liberado. O usuário pode entrar com a senha criada durante a solicitação." });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível processar a solicitação." }, 500);
  }
});
