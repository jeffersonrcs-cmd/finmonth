import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disconnectCloud, financeActions, useFinanceState } from "@/lib/finance";
import { supabase } from "@/lib/supabase";

export function AccountSettings({ onBack, section = "profile" }: { onBack: () => void; section?: "profile" | "notifications" }) {
  const { userName, notificationPreferences } = useFinanceState();
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
    return () => {
      active = false;
    };
  }, []);

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Excluir sua conta apagará permanentemente seu cadastro e todos os seus dados financeiros. Esta ação não pode ser desfeita. Deseja continuar?",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const { error: deleteError } = await supabase.rpc("delete_current_user");
      if (deleteError) throw deleteError;

      disconnectCloud();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir sua conta.");
      setDeleting(false);
    }
  }

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
          <h1 className="font-display text-xl font-semibold">
            {section === "notifications" ? "Notificações" : "Editar dados do usuário"}
          </h1>
          <p className="mt-1 text-xs text-mut">
            {section === "notifications" ? "Configure os avisos das suas contas." : "Edite os dados usados no seu cadastro."}
          </p>
        </div>
      </div>

      {section === "profile" && (
        <>
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
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neg/20 bg-neg/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neg transition-colors hover:bg-neg/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="size-4" /> {deleting ? "Excluindo conta..." : "Excluir conta"}
            </button>
          </div>
        </>
      )}

      {section === "notifications" && (
        <section className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Bell className="size-4" /></div>
            <div>
              <h2 className="font-display text-sm font-semibold">Avisos de contas</h2>
              <p className="mt-1 text-xs leading-relaxed text-mut">Configure os avisos de contas próximas, vencendo hoje e atrasadas.</p>
            </div>
          </div>
          <label className="glass-soft flex items-center justify-between rounded-xl px-3 py-3 text-xs">
            <span>Ativar avisos</span>
            <input type="checkbox" checked={notificationPreferences.enabled} onChange={(e) => financeActions.setNotificationPreferences({ ...notificationPreferences, enabled: e.target.checked })} className="size-4" />
          </label>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-mut">Antecedência</Label>
            <Select
              value={String(notificationPreferences.leadDays)}
              disabled={!notificationPreferences.enabled}
              onValueChange={(value) =>
                financeActions.setNotificationPreferences({
                  ...notificationPreferences,
                  leadDays: Number(value),
                })
              }
            >
              <SelectTrigger className="glass-soft h-11 w-full rounded-xl border-0 px-3 text-base shadow-none focus:ring-1 focus:ring-brand/40">
                <SelectValue placeholder="Selecione a antecedência" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 bg-popover/95 p-1 shadow-xl backdrop-blur-xl">
                <SelectItem value="0" className="rounded-lg py-2.5 text-sm">Somente no vencimento</SelectItem>
                <SelectItem value="1" className="rounded-lg py-2.5 text-sm">1 dia antes</SelectItem>
                <SelectItem value="2" className="rounded-lg py-2.5 text-sm">2 dias antes</SelectItem>
                <SelectItem value="3" className="rounded-lg py-2.5 text-sm">3 dias antes</SelectItem>
                <SelectItem value="7" className="rounded-lg py-2.5 text-sm">7 dias antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="glass-soft flex items-center justify-between rounded-xl px-3 py-3 text-xs">
            <span>Conta vencendo hoje</span>
            <input type="checkbox" checked={notificationPreferences.dueToday} disabled={!notificationPreferences.enabled} onChange={(e) => financeActions.setNotificationPreferences({ ...notificationPreferences, dueToday: e.target.checked })} className="size-4" />
          </label>
          <label className="glass-soft flex items-center justify-between rounded-xl px-3 py-3 text-xs">
            <span>Conta atrasada</span>
            <input type="checkbox" checked={notificationPreferences.overdue} disabled={!notificationPreferences.enabled} onChange={(e) => financeActions.setNotificationPreferences({ ...notificationPreferences, overdue: e.target.checked })} className="size-4" />
          </label>
        </section>
      )}

      <p className="pt-1 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-mut/70">
        FinMonth v{__FINMONTH_VERSION__}
      </p>
    </section>
  );
}
