import { Check, Mail, RotateCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export function ConfirmEmailScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    try {
      return sessionStorage.getItem("finmonth:confirmation-email") ?? "";
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resend() {
    const normalizedEmail = email.trim();
    setMessage("");
    setError("");
    if (!normalizedEmail) {
      setError(t("confirmationEmailMissing"));
      return;
    }
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: "https://finmonth.lovable.app/confirmar-email" },
      });
      if (resendError) throw resendError;
      setMessage(t("confirmationSent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-brand/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-accent/20 blur-[100px]" />
      <section className="relative w-full max-w-[390px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            {message ? <Check className="size-6" /> : <Mail className="size-6" />}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            FinMonth
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">{t("confirmationEmail")}</h1>
          <p className="mt-2 text-sm text-mut">{t("confirmationEmailDescription")}</p>
        </div>
        <div className="glass space-y-4 rounded-3xl p-5 shadow-xl">
          <div className="rounded-2xl bg-brand/10 px-4 py-3 text-sm leading-relaxed text-foreground">
            <p className="font-medium break-all">{email || "—"}</p>
            <p className="mt-1 text-xs text-mut">{t("confirmationEmailFallback")}</p>
          </div>
          {message && (
            <p className="rounded-xl bg-brand/10 px-3 py-2 text-xs leading-relaxed text-brand">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-neg/10 px-3 py-2 text-xs leading-relaxed text-neg">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Input
              className="glass-soft h-11 rounded-xl border-0 text-base"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("email")}
              autoComplete="email"
              aria-label={t("email")}
            />
            <Button
              type="button"
              onClick={() => void resend()}
              disabled={busy}
              className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
            >
              <RotateCw className="mr-2 size-4" />
              {busy ? t("wait") : t("resendConfirmation")}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="w-full text-center text-xs text-mut transition-colors hover:text-brand"
          >
            {t("goToLogin")}
          </button>
        </div>
      </section>
    </main>
  );
}
