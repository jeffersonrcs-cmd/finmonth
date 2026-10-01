import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const smtpHost = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const smtpPort = Number(Deno.env.get("SMTP_PORT") ?? "465");
const smtpUser = Deno.env.get("SMTP_USER") ?? "";
const smtpPassword = Deno.env.get("SMTP_PASSWORD") ?? "";
const emailFrom = Deno.env.get("FINMONTH_EMAIL_FROM") ?? smtpUser;

const readResponse = async (conn: Deno.TlsConn) => {
  const buffer = new Uint8Array(4096);
  let text = "";
  while (true) {
    const count = await conn.read(buffer);
    if (count === null) break;
    text += new TextDecoder().decode(buffer.subarray(0, count));
    if (/\r?\n$/.test(text) && /(?:^|\r?\n)\d{3} /.test(text)) break;
  }
  return text;
};

const smtpCommand = async (conn: Deno.TlsConn, command: string, expected: RegExp) => {
  await conn.write(new TextEncoder().encode(command + "\r\n"));
  const response = await readResponse(conn);
  if (!expected.test(response)) throw new Error("Servidor SMTP recusou a operação.");
  return response;
};

const sendApprovalEmail = async (name: string, email: string) => {
  if (!smtpUser || !smtpPassword || !emailFrom) {
    throw new Error("SMTP de aprovação não configurado.");
  }

  const conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort });
  try {
    const greeting = await readResponse(conn);
    if (!/^220 /.test(greeting)) throw new Error("Servidor SMTP indisponível.");

    await smtpCommand(conn, "EHLO finmonth", /^250[ -]/);
    await smtpCommand(conn, "AUTH LOGIN", /^334[ -]/);
    await smtpCommand(conn, btoa(smtpUser), /^334[ -]/);
    await smtpCommand(conn, btoa(smtpPassword), /^235[ -]/);
    await smtpCommand(conn, `MAIL FROM:<${emailFrom}>`, /^250[ -]/);
    await smtpCommand(conn, `RCPT TO:<${email}>`, /^250[ -]/);
    await smtpCommand(conn, "DATA", /^354[ -]/);

    const safeName = name.replace(/[\r\n]/g, " ").trim();
    const subject = "Seu cadastro no FinMonth foi aprovado";
    const body = [
      `Olá, ${safeName}!`,
      "",
      "Seu cadastro no FinMonth foi aprovado.",
      "Você já pode acessar o FinMonth usando o e-mail cadastrado e a senha que criou durante a solicitação.",
      "",
      "Abra o FinMonth e faça seu login.",
    ].join("\r\n");

    const message = [
      `From: FinMonth <${emailFrom}>`,
      `To: <${email}>`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
      ".",
    ].join("\r\n");

    await smtpCommand(conn, message, /^250[ -]/);
    await smtpCommand(conn, "QUIT", /^221[ -]/);
  } finally {
    conn.close();
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Não autenticado." }, 401);

  const service = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Sessão inválida." }, 401);

    const { data: admin, error: adminError } = await service
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!admin) return json({ error: "Acesso administrativo necessário." }, 403);

    const body = await req.json();

    if (body?.action === "list") {
      const { data: requests, error } = await service
        .from("signup_requests")
        .select("id,name,email,status,created_at,approval_email_sent_at")
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return json({ requests: requests ?? [] });
    }

    const requestId = typeof body?.requestId === "string" ? body.requestId : "";
    const action = body?.action;
    if (!requestId || !["approve", "reject", "resend"].includes(action)) {
      return json({ error: "Ação inválida." }, 400);
    }

    const { data: request, error: requestError } = await service
      .from("signup_requests")
      .select("id,name,email,status,auth_user_id,approval_email_sent_at")
      .eq("id", requestId)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!request) return json({ error: "Solicitação não encontrada." }, 404);

    const processedAt = new Date().toISOString();

    if (action === "reject") {
      if (request.status !== "pending") return json({ error: "Solicitação já processada." }, 409);

      const { data: rejected, error } = await service
        .from("signup_requests")
        .update({
          status: "rejected",
          processed_at: processedAt,
          processed_by: userData.user.id,
          approval_email_error: null,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!rejected) return json({ error: "Esta solicitação acabou de ser processada por outro administrador." }, 409);

      if (request.auth_user_id) {
        const { error: deleteError } = await service.auth.admin.deleteUser(request.auth_user_id);
        if (deleteError) console.error("Falha ao remover usuário rejeitado:", deleteError);
      }
      return json({ message: "Solicitação rejeitada." });
    }

    if (!request.auth_user_id) return json({ error: "Solicitação sem usuário de autenticação associado." }, 409);

    if (action === "approve") {
      if (request.status !== "pending") return json({ error: "Solicitação já processada." }, 409);

      const { data: reserved, error: reserveError } = await service
        .from("signup_requests")
        .update({
          status: "approved",
          processed_at: processedAt,
          processed_by: userData.user.id,
          approval_email_error: null,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (reserveError) throw reserveError;
      if (!reserved) return json({ error: "Esta solicitação acabou de ser processada por outro administrador." }, 409);

      const { error: confirmError } = await service.auth.admin.updateUserById(
        request.auth_user_id,
        { email_confirm: true },
      );
      if (confirmError) {
        await service.from("signup_requests").update({
          status: "pending",
          processed_at: null,
          processed_by: null,
          approval_email_error: confirmError.message,
        }).eq("id", requestId).eq("status", "approved");
        throw confirmError;
      }

      try {
        await sendApprovalEmail(request.name, request.email);
        await service.from("signup_requests").update({
          approval_email_sent_at: new Date().toISOString(),
          approval_email_error: null,
        }).eq("id", requestId).eq("status", "approved");
        return json({ message: "Cadastro aprovado. O acesso foi liberado e o e-mail de aprovação foi enviado." });
      } catch (emailError) {
        const message = emailError instanceof Error ? emailError.message : "Falha no envio do e-mail.";
        await service.from("signup_requests").update({
          approval_email_error: message,
        }).eq("id", requestId).eq("status", "approved");
        return json({
          message: "Cadastro aprovado e acesso liberado, mas o e-mail de aprovação não pôde ser enviado. Você pode reenviá-lo.",
          emailSent: false,
        }, 200);
      }
    }

    if (request.status !== "approved") {
      return json({ error: "A solicitação precisa estar aprovada para reenviar o e-mail." }, 409);
    }

    try {
      await sendApprovalEmail(request.name, request.email);
      const sentAt = new Date().toISOString();
      const { error: updateError } = await service
        .from("signup_requests")
        .update({ approval_email_sent_at: sentAt, approval_email_error: null })
        .eq("id", requestId)
        .eq("status", "approved");
      if (updateError) throw updateError;
      return json({ message: "E-mail de aprovação reenviado." });
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : "Falha no envio do e-mail.";
      await service.from("signup_requests").update({ approval_email_error: message })
        .eq("id", requestId).eq("status", "approved");
      throw emailError;
    }
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível processar a solicitação." }, 500);
  }
});
