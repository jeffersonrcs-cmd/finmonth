import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { disconnectCloud, financeActions, useFinanceState } from "@/lib/finance";
import { supabase } from "@/lib/supabase";

export function AccountSettings({ onBack }: { onBack: () => void }) {
  const { userName } = useFinanceState();
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? "");
    });


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Informe seu nome.");

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sua sessão expirou. Entre novamente.");

      const normalizedEmail = email.trim();
      const currentEmail = userData.user?.email ?? "";

      if (normalizedEmail !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: normalizedEmail });
        if (emailError) throw emailError;
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw passwordError;
        setPassword("");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName })
        .eq("id", userId);
      if (profileError) throw profileError;

      financeActions.setUserName(trimmedName);
      setMessage(
        normalizedEmail !== currentEmail
          ? "Dados salvos. Verifique seu e-mail para confirmar a alteração do endereço."
          : "Dados da conta atualizados.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar sua conta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="glass-soft grid size-9 place-items-center rounded-full text-mut transition-colors hover:text-brand"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold">Configurações da conta</h1>
          <p className="mt-1 text-xs text-mut">Edite os dados usados no seu cadastro.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-5">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-mut">Nome</Label>
          <Input className="glass-soft h-11 rounded-xl border-0 text-base" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-mut">E-mail</Label>
          <Input className="glass-soft h-11 rounded-xl border-0 text-base" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-mut">Nova senha</Label>
          <div className="relative">
            <Input
              className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para manter"
              autoComplete="new-password"
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && <p className="rounded-xl bg-neg/10 px-3 py-2 text-xs leading-relaxed text-neg">{error}</p>}
        {message && (
          <p className="flex items-start gap-2 rounded-xl bg-brand/10 px-3 py-2 text-xs leading-relaxed text-brand">
            <Check className="mt-0.5 size-3.5 shrink-0" /> {message}
          </p>
        )}

        <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90">
          {busy ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          disabled={deleting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neg/20 px-4 py-3 text-xs font-semibold text-neg transition-colors hover:bg-neg/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="size-4" /> Sair da conta
        </button>

        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={deleting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neg/20 bg-neg/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neg transition-colors hover:bg-neg/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="size-4" /> {deleting ? "Excluindo conta..." : "Excluir conta"}
        </button>
      </div>
    </section>
  );
}
