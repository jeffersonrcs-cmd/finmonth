import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "gemini-3.1-flash-lite";

const SYSTEM_INSTRUCTION = `
Você é Fin IA, o assistente financeiro do aplicativo FinMonth.

Sua função é analisar exclusivamente os dados financeiros reais enviados pelo FinMonth para o usuário autenticado.

REGRAS OBRIGATÓRIAS:
- Nunca invente valores, lançamentos, categorias, datas ou fatos.
- Nunca estime um dado que não exista nos registros.
- Se os dados não forem suficientes para responder, diga isso claramente.
- Faça cálculos somente a partir dos dados fornecidos.
- Compare períodos quando solicitado.
- Identifique médias, aumentos, reduções, tendências e percentuais quando houver dados suficientes.
- Ao fazer uma análise, considere maior gasto, menor gasto, média, tendência e percentual de variação quando aplicável.
- Não crie categorias: o modelo atual do FinMonth não possui categorias armazenadas.
- Você pode analisar descrições reais dos lançamentos, como uma conta chamada "Luz" ou "Energia".
- Responda no idioma solicitado pelo aplicativo, de forma clara, objetiva, amigável e útil.
- Não dê aconselhamento financeiro baseado em informações externas ao FinMonth.
- Quando o usuário solicitar ou demonstrar intenção de CADASTRAR/ADICIONAR/LANÇAR uma conta (despesa), receita ou valor guardado (ou quando você sugerir cadastrar um lançamento específico):
  Preencha o campo "action" no JSON com o tipo e os dados identificados.
  Os tipos permitidos de action são:
  1) Para contas: { "type": "create_bill", "data": { "description": "nome da conta", "amount": 100.0, "dueDay": 10, "recurrent": true ou false, "paid": false } }
  2) Para receitas: { "type": "create_income", "data": { "description": "descrição da receita", "amount": 2500.0, "day": 5 } }
  3) Para guardado: { "type": "create_saving", "data": { "description": "descrição da reserva/guardado", "amount": 500.0 } }
  Se o usuário não informou algum campo (por exemplo o dia ou o valor), use valores padrão coerentes (ex: dia 5 ou dia 1, valor 0 se não especificado) ou pergunte/preencha com o que foi fornecido para que ele possa revisar no card de confirmação.
  No texto da resposta ("text"), explique amigavelmente que você preparou o lançamento e peça para ele confirmar no botão abaixo.

MODOS DE GRÁFICO PERMITIDOS:
null, month, compare, year, history, balance, savings, topBills, cashflow, incomeBreakdown, billStatus, dailyFlow, recurring.

RESPONDA EXCLUSIVAMENTE com JSON válido, sem markdown:
{
  "title": "título curto",
  "text": "resposta para o usuário",
  "chartMode": "um dos modos permitidos ou null",
  "action": null ou { "type": "create_bill" | "create_income" | "create_saving", "data": { ... } }
}

DADOS FINANCEIROS:
O objeto abaixo contém somente os registros do usuário autenticado. Use esses dados como única fonte factual.
`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type InteractionLike = {
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
};

function extractOutputText(interaction: unknown) {
  const inter = interaction as InteractionLike;
  for (const step of inter?.steps ?? []) {
    if (step?.type !== "model_output") continue;
    for (const content of step?.content ?? []) {
      if (content?.type === "text" && typeof content.text === "string") return content.text;
    }
  }
  return typeof inter?.output_text === "string" ? inter.output_text : "";
}

function parseModelJson(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sanitizeChartMode(value: unknown) {
  const allowed = new Set([
    "month",
    "compare",
    "year",
    "history",
    "balance",
    "savings",
    "topBills",
    "cashflow",
    "incomeBreakdown",
    "billStatus",
    "dailyFlow",
    "recurring",
  ]);
  return typeof value === "string" && allowed.has(value) ? value : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return jsonResponse({ error: "A chave do Gemini ainda não foi configurada no Supabase." }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return jsonResponse({ error: "Sessão não autenticada." }, 401);

  const publishableKeysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!publishableKeysRaw)
    return jsonResponse({ error: "Configuração do Supabase indisponível." }, 500);

  let publishableKey: string;
  try {
    const keys = JSON.parse(publishableKeysRaw);
    publishableKey = keys.default;
  } catch {
    return jsonResponse({ error: "Configuração de chave do Supabase inválida." }, 500);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user)
    return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);

  let body: {
    question?: string;
    monthKey?: string;
    history?: Array<{ role: string; text: string }>;
    language?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Requisição inválida." }, 400);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const language =
    body.language === "en-US" ? "en-US" : body.language === "es-ES" ? "es-ES" : "pt-BR";
  const languageName =
    language === "en-US" ? "English" : language === "es-ES" ? "Spanish" : "Portuguese (Brazil)";
  // Consumir quota diária do usuário (máximo 20 perguntas/dia)
  const { data: quota, error: quotaError } = await supabase.rpc("consume_fin_ai_quota");
  if (!quotaError && quota && quota.allowed === false) {
    const quotaExceededMsg =
      language === "en-US"
        ? "Daily limit reached for FinAI (20 questions/day). Please try again tomorrow!"
        : language === "es-ES"
          ? "Has alcanzado el límite diario de FinAI (20 preguntas al día). ¡Vuelve a intentarlo mañana!"
          : "Você atingiu o limite diário de uso da FinAI (20 perguntas por dia). Tente novamente amanhã!";
    return jsonResponse({ error: quotaExceededMsg }, 429);
  }

  const localized = {
    invalidQuestion:
      language === "en-US"
        ? "Enter a question."
        : language === "es-ES"
          ? "Introduce una pregunta."
          : "Informe uma pergunta.",
    financeError:
      language === "en-US"
        ? "Could not access your financial data."
        : language === "es-ES"
          ? "No se pudieron consultar tus datos financieros."
          : "Não foi possível consultar seus dados financeiros.",
    geminiRate:
      language === "en-US"
        ? "Gemini reached its free limit right now. Try again later."
        : language === "es-ES"
          ? "Gemini alcanzó su límite gratuito en este momento. Inténtalo más tarde."
          : "O Gemini atingiu o limite gratuito neste momento. Tente novamente mais tarde.",
    geminiError:
      language === "en-US"
        ? "Gemini could not process the question right now."
        : language === "es-ES"
          ? "Gemini no pudo procesar la pregunta ahora."
          : "O Gemini não conseguiu processar a pergunta agora.",
    noResponse:
      language === "en-US"
        ? "I could not generate a response right now. Try again."
        : language === "es-ES"
          ? "No pude generar una respuesta ahora. Inténtalo de nuevo."
          : "Não consegui gerar uma resposta agora. Tente novamente.",
  };
  if (!question) return jsonResponse({ error: localized.invalidQuestion }, 400);

  const monthKey =
    typeof body.monthKey === "string" && /^\d{4}-\d{2}$/.test(body.monthKey)
      ? body.monthKey
      : new Date().toISOString().slice(0, 7);

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.text === "string",
        )
        .slice(-8)
        .map((item) => ({ role: item.role, text: item.text.slice(0, 3000) }))
    : [];

  const { data: rows, error: financeError } = await supabase
    .from("finance_months")
    .select("month_key,data")
    .eq("user_id", userData.user.id)
    .order("month_key", { ascending: true });

  if (financeError) return jsonResponse({ error: localized.financeError }, 500);

  // Otimização: prioriza os últimos 6 meses para respostas mais rápidas e econômicas
  const relevantRows = (rows ?? []).slice(-6);
  const financeData = Object.fromEntries(relevantRows.map((row) => [row.month_key, row.data]));

  const input = [
    `Idioma obrigatório da resposta: ${languageName}`,
    `Mês de referência: ${monthKey}`,
    "",
    "Histórico recente da conversa:",
    JSON.stringify(history),
    "",
    "Pergunta atual do usuário:",
    question,
    "",
    "Registros financeiros completos do usuário:",
    JSON.stringify(financeData),
  ].join("\n");

  const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      system_instruction: `${SYSTEM_INSTRUCTION}\n\nIDIOMA OBRIGATÓRIO: Responda exclusivamente em ${languageName}.`,
      store: false,
      generation_config: {
        thinking_level: "minimal",
        max_output_tokens: 800,
      },
    }),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error("Gemini API error", geminiResponse.status, errorText.slice(0, 1000));
    if (geminiResponse.status === 429) {
      return jsonResponse({ error: localized.geminiRate }, 429);
    }
    return jsonResponse({ error: localized.geminiError }, 502);
  }

  const interaction = await geminiResponse.json();
  const raw = extractOutputText(interaction);
  const parsed = parseModelJson(raw);

  if (!parsed || typeof parsed.text !== "string") {
    return jsonResponse({
      title: "Fin IA",
      text: raw || localized.noResponse,
      chartMode: null,
    });
  }

  function sanitizeAction(action: unknown) {
    if (!action || typeof action !== "object") return null;
    const act = action as { type?: unknown; data?: Record<string, unknown> };
    if (act.type === "create_bill" && act.data) {
      return {
        type: "create_bill",
        data: {
          description:
            typeof act.data.description === "string" ? act.data.description.slice(0, 100) : "Conta",
          amount: Math.abs(Number(act.data.amount) || 0),
          dueDay: Math.min(Math.max(Number(act.data.dueDay) || 5, 1), 31),
          recurrent: Boolean(act.data.recurrent),
          paid: Boolean(act.data.paid),
        },
      };
    }
    if (act.type === "create_income" && act.data) {
      return {
        type: "create_income",
        data: {
          description:
            typeof act.data.description === "string"
              ? act.data.description.slice(0, 100)
              : "Receita",
          amount: Math.abs(Number(act.data.amount) || 0),
          day: Math.min(Math.max(Number(act.data.day) || 1, 1), 31),
        },
      };
    }
    if (act.type === "create_saving" && act.data) {
      return {
        type: "create_saving",
        data: {
          description:
            typeof act.data.description === "string"
              ? act.data.description.slice(0, 100)
              : "Guardado",
          amount: Math.abs(Number(act.data.amount) || 0),
        },
      };
    }
    return null;
  }

  return jsonResponse({
    title:
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim().slice(0, 120)
        : "Fin IA",
    text: parsed.text.trim().slice(0, 6000),
    chartMode: sanitizeChartMode(parsed.chartMode),
    action: sanitizeAction(parsed.action),
  });
});
