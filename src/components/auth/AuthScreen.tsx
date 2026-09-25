import { FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n";

export function AuthScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const appOrigin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://finmonth.lovable.app";

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${appOrigin}/confirmar-email`,
          },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          try {
            sessionStorage.setItem("finmonth:confirmation-email", email.trim());
          } catch {
            /* ignore */
          }
          void navigate({ to: "/confirmar-email" });
        } else {
          setMessage(t("accountCreated"));
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim();
    setMessage("");
    setError("");

    if (!normalizedEmail) {
      setError(t("email"));
      return;
    }

    setBusy(true);
    try {
      const appOrigin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://finmonth.lovable.app";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${appOrigin}/redefinir-senha`,
      });
      if (resetError) throw resetError;
      setMessage(t("recoverySent"));
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
            {mode === "login" ? <LogIn className="size-6" /> : <UserPlus className="size-6" />}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            FinMonth
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            {mode === "login" ? t("enterAccount") : t("createAccount")}
          </h1>
          <p className="mt-2 text-sm text-mut">{t("financialDataSaved")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-5 shadow-xl">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-mut">{t("name")}</Label>
              <Input
                className="glass-soft h-11 rounded-xl border-0 text-base"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("yourName")}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-mut">{t("email")}</Label>
            <Input
              className="glass-soft h-11 rounded-xl border-0 text-base"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-mut">
              {t("password")}
            </Label>
            <div className="relative">
              <Input
                className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("minPassword")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut transition-colors hover:text-brand"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-neg/10 px-3 py-2 text-xs leading-relaxed text-neg">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl bg-brand/10 px-3 py-2 text-xs leading-relaxed text-brand">
              {message}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
          >
            {busy ? t("wait") : mode === "login" ? t("login") : t("signup")}
          </Button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-mut transition-colors hover:text-brand disabled:opacity-60"
            >
              <KeyRound className="size-3.5" />
              {t("forgotPassword")}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
              setError("");
              setPassword("");
              setShowPassword(false);
            }}
            className="w-full text-center text-xs text-mut transition-colors hover:text-brand"
          >
            {mode === "login" ? t("noAccount") : t("hasAccount")}
          </button>
        </form>
      </section>
    </main>
  );
}
