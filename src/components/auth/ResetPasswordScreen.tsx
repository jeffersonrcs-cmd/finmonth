import { FormEvent, useState } from "react";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export function ResetPasswordScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 6) {
      setError(t("minPassword"));
      return;
    }

    if (password !== confirmation) {
      setError(t("confirmPassword"));
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setPassword("");
      setConfirmation("");
      setMessage(t("accountUpdated"));
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
            {message ? <Check className="size-6" /> : <KeyRound className="size-6" />}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            FinMonth
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">{t("newPassword")}</h1>
          <p className="mt-2 text-sm text-mut">{t("passwordRecovery")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-5 shadow-xl">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-mut">
              {t("newPassword")}
            </Label>
            <div className="relative">
              <Input
                className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("minPassword")}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={busy || Boolean(message)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hideNewPassword") : t("showNewPassword")}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut transition-colors hover:text-brand"
                disabled={busy || Boolean(message)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-mut">
              {t("confirmPassword")}
            </Label>
            <div className="relative">
              <Input
                className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
                type={showConfirmation ? "text" : "password"}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={t("repeatPassword")}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={busy || Boolean(message)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((value) => !value)}
                aria-label={showConfirmation ? t("hidePassword") : t("showPassword")}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut transition-colors hover:text-brand"
                disabled={busy || Boolean(message)}
              >
                {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-neg/10 px-3 py-2 text-xs leading-relaxed text-neg">
              {error}
            </p>
          )}
          {message && (
            <div className="space-y-3">
              <p className="rounded-xl bg-brand/10 px-3 py-2 text-xs leading-relaxed text-brand">
                {message}
              </p>
              <Button
                type="button"
                onClick={() => void navigate({ to: "/" })}
                className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
              >
                {t("continue")}
              </Button>
            </div>
          )}

          {!message && (
            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
            >
              {busy ? t("wait") : t("saveNewPassword")}
            </Button>
          )}

          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            disabled={busy}
            className="w-full text-center text-xs text-mut transition-colors hover:text-brand disabled:opacity-60"
          >
            {t("backToLogin")}
          </button>
        </form>
      </section>
    </main>
  );
}
