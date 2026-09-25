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
- Não diga que executou uma ação no aplicativo; nesta versão você apenas analisa dados.
- Os gráficos são renderizados pelo aplicativo. Escolha somente um chartMode permitido quando um gráfico realmente ajudar.

MODOS DE GRÁFICO PERMITIDOS:
null, month, compare, year, history, balance, savings, topBills, cashflow, incomeBreakdown, billStatus, dailyFlow, recurring.

RESPONDA EXCLUSIVAMENTE com JSON válido, sem markdown:
{
  "title": "título curto",
  "text": "resposta para o usuário",
  "chartMode": "um dos modos permitidos ou null"
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

  const financeData = Object.fromEntries((rows ?? []).map((row) => [row.month_key, row.data]));

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

  return jsonResponse({
    title:
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim().slice(0, 120)
        : "Fin IA",
    text: parsed.text.trim().slice(0, 6000),
    chartMode: sanitizeChartMode(parsed.chartMode),
  });
});
