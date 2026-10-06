import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

const INVITE_ERROR =
  "Este convite é inválido ou expirou. Solicite um novo link ao administrador.";

export function ConfirmEmailScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        if (type === "invite" && tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });
          if (verifyError) throw verifyError;
        } else {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          const hashType = hash.get("type");

          if (hashType === "invite" && accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error(INVITE_ERROR);

        if (active) {
          setReady(true);
          window.history.replaceState({}, document.title, "/confirmar-email");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : INVITE_ERROR);
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setPassword("");
      setConfirmation("");
      setMessage("Senha criada com sucesso. Agora você já pode entrar no FinMonth.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar sua senha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-mut">Validando seu convite...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <section className="relative w-full max-w-[390px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <KeyRound className="size-6" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">FinMonth</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Criar senha</h1>
          <p className="mt-2 text-sm text-mut">
            Seu cadastro foi aprovado. Confirme seu e-mail e defina agora a senha da sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-5 shadow-xl">
          {error && (
            <p className="rounded-xl bg-neg/10 px-3 py-2 text-xs leading-relaxed text-neg">{error}</p>
          )}
          {message && (
            <p className="rounded-xl bg-brand/10 px-3 py-2 text-xs leading-relaxed text-brand">{message}</p>
          )}

          {ready && !message && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-mut">Nova senha</Label>
                <div className="relative">
                  <Input
                    className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut hover:text-brand"
                    disabled={saving}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-mut">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
                    type={showConfirmation ? "text" : "password"}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmation((value) => !value)}
                    aria-label={showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut hover:text-brand"
                    disabled={saving}
                  >
                    {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
              >
                {saving ? "Salvando..." : "Criar minha senha"}
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="w-full text-center text-xs text-mut hover:text-brand"
          >
            Voltar para o login
          </button>
        </form>
      </section>
    </main>
  );
}
