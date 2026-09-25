import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  Eye,
  EyeOff,
  Info,
  Languages,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Trash2,
  Smartphone,
  Send,
  Download,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { disconnectCloud, financeActions, useFinanceState } from "@/lib/finance";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  sendNativeBillNotification,
} from "@/lib/notifications";
import {
  CURRENCIES,
  LANGUAGES,
  setLanguage,
  setCurrency,
  useLanguage,
  type CurrencyCode,
  type LanguageCode,
} from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export function AccountSettings({
  onBack,
  section = "menu",
  onOpenSection,
  onSignOut,
}: {
  onBack: () => void;
  section?: "menu" | "profile" | "notifications" | "language" | "version";
  onOpenSection?: (section: "profile" | "notifications" | "language" | "version") => void;
  onSignOut?: () => void;
}) {
  const { userName, notificationPreferences, theme } = useFinanceState();
  const { language, currency, currencyLoading, t } = useLanguage();
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission(),
  );
  const [pushTestMessage, setPushTestMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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
    const confirmed = window.confirm(t("accountDeleted"));
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
      setError(err instanceof Error ? err.message : t("accountNotUpdated"));
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
      if (!trimmedName) throw new Error(t("enterName"));

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error(t("sessionExpired"));

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
      setMessage(normalizedEmail !== currentEmail ? t("emailChanged") : t("accountUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("accountNotUpdated"));
    } finally {
      setBusy(false);
    }
  }

  const reloadLatestVersion = () => {
    const updateUrl = new URL(window.location.href);
    updateUrl.searchParams.set("finmonth-update", Date.now().toString());
    window.location.replace(updateUrl.toString());
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className="glass-soft grid size-9 place-items-center rounded-full text-mut transition-colors hover:text-brand"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold">
            {section === "menu"
              ? t("settings")
              : section === "notifications"
                ? t("notifications")
                : section === "language"
                  ? t("language")
                  : section === "version"
                    ? t("version")
                    : t("profile")}
          </h1>
          <p className="mt-1 text-xs text-mut">
            {section === "menu"
              ? t("settingsDescription")
              : section === "notifications"
                ? t("notificationsDescription")
                : section === "version"
                  ? t("versionInfo")
                  : t("profile")}
          </p>
        </div>
      </div>

      {section === "menu" && (
        <section className="glass space-y-2 rounded-3xl p-3">
          <button
            type="button"
            onClick={() => onOpenSection?.("profile")}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-medium"
          >
            <Settings className="size-4 text-mut" />
            {t("profile")}
          </button>
          <button
            type="button"
            onClick={() => onOpenSection?.("notifications")}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-medium"
          >
            <Bell className="size-4 text-mut" />
            {t("notifications")}
          </button>
          <button
            type="button"
            onClick={() => onOpenSection?.("language")}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-medium"
          >
            <Languages className="size-4 text-mut" />
            {t("language")}
          </button>
          <button
            type="button"
            onClick={() => financeActions.setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-medium"
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-mut" />
            ) : (
              <Moon className="size-4 text-mut" />
            )}
            {theme === "dark" ? t("themeLight") : t("themeDark")}
          </button>
          <button
            type="button"
            onClick={() => onOpenSection?.("version")}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-medium"
          >
            <Info className="size-4 text-mut" />
            {t("version")}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-medium text-neg"
          >
            <LogOut className="size-4" />
            {t("signOut")}
          </button>
        </section>
      )}

      {section === "language" && (
        <section className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <Languages className="size-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold">{t("chooseLanguage")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-mut">
                {t("chooseLanguageDescription")}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {LANGUAGES.map((item) => {
              const selected = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code as LanguageCode)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${selected ? "border-brand/40 bg-brand/10" : "border-border/60 bg-muted/20 hover:border-brand/25"}`}
                >
                  <span>
                    <span className="block text-sm font-medium">{item.nativeLabel}</span>
                    <span className="mt-0.5 block text-[10px] text-mut">{item.label}</span>
                  </span>
                  {selected && <Check className="size-4 text-brand" />}
                </button>
              );
            })}
          </div>
          <p className="text-center text-[10px] text-mut">
            {t("selectedLanguage")}: {LANGUAGES.find((item) => item.code === language)?.nativeLabel}
          </p>
          <div className="border-t border-border/50 pt-4">
            <div className="mb-2">
              <h3 className="text-xs font-semibold">{t("currency")}</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-mut">
                {t("currencyDescription")}
              </p>
            </div>
            <div className="space-y-2">
              {CURRENCIES.map((item) => {
                const selected = currency === item.code;
                const label =
                  item.code === "BRL"
                    ? t("currencyBRL")
                    : item.code === "USD"
                      ? t("currencyUSD")
                      : t("currencyEUR");
                return (
                  <button
                    key={item.code}
                    type="button"
                    disabled={currencyLoading}
                    onClick={() => void setCurrency(item.code as CurrencyCode)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${selected ? "border-brand/40 bg-brand/10" : "border-border/60 bg-muted/20 hover:border-brand/25"} disabled:cursor-wait disabled:opacity-60`}
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        {item.symbol} {item.code}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-mut">{label}</span>
                    </span>
                    {selected && <Check className="size-4 text-brand" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[10px] text-mut">{t("currencyRate")}</p>
          </div>
        </section>
      )}

      {section === "version" && (
        <section className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <Info className="size-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold">FinMonth</h2>
              <p className="mt-1 text-xs leading-relaxed text-mut">{t("versionInfo")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-soft rounded-2xl p-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-mut">
                {t("version")}
              </p>
              <p className="mt-1 font-display text-lg font-semibold">v{__FINMONTH_VERSION__}</p>
            </div>
            <div className="glass-soft rounded-2xl p-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-mut">
                {t("build")}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] font-medium text-mut">
                {__FINMONTH_BUILD_ID__}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-mut">
              {t("generatedAt")}
            </p>
            <p className="mt-1 text-xs font-medium">
              {new Date(__FINMONTH_BUILD_ID__).toLocaleString(language, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={reloadLatestVersion}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[11px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-brand/90"
          >
            <RefreshCw className="size-4" />
            {t("updateApp")}
          </button>

          {installPrompt && !isStandalone && (
            <button
              type="button"
              onClick={async () => {
                if (installPrompt) {
                  installPrompt.prompt();
                  const outcome = await installPrompt.userChoice;
                  if (outcome.outcome === "accepted") {
                    setInstallPrompt(null);
                  }
                }
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 text-[11px] font-semibold uppercase tracking-widest text-brand transition-colors hover:bg-brand/20"
            >
              <Download className="size-4" />
              {t("installApp")}
            </button>
          )}

          <div className="rounded-2xl border border-pos/20 bg-pos/5 px-3.5 py-3">
            <p className="text-[11px] leading-relaxed text-pos/90">
              ✓ {t("offlineReadyNotice")}
            </p>
          </div>

          <p className="text-center text-[10px] leading-relaxed text-mut">{t("autoUpdateInfo")}</p>
        </section>
      )}

      {section === "profile" && (
        <>
          <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-mut">{t("name")}</Label>
              <Input
                className="glass-soft h-11 rounded-xl border-0 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-mut">{t("email")}</Label>
              <Input
                className="glass-soft h-11 rounded-xl border-0 text-base"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-mut">
                {t("newPassword")}
              </Label>
              <div className="relative">
                <Input
                  className="glass-soft h-11 rounded-xl border-0 pr-11 text-base"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("keepPassword")}
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-mut"
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
              <p className="flex items-start gap-2 rounded-xl bg-brand/10 px-3 py-2 text-xs leading-relaxed text-brand">
                <Check className="mt-0.5 size-3.5 shrink-0" /> {message}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
            >
              {busy ? t("wait") : t("saveChanges")}
            </Button>
          </form>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neg/20 bg-neg/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neg transition-colors hover:bg-neg/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="size-4" /> {deleting ? t("deletingAccount") : t("deleteAccount")}
            </button>
          </div>
        </>
      )}

      {section === "notifications" && (
        <section className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <Bell className="size-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold">{t("notificationsSettings")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-mut">
                {t("notificationsDescription")}
              </p>
            </div>
          </div>
          <label className="glass-soft flex items-center justify-between rounded-xl px-3 py-3 text-xs">
            <span>{t("enableNotifications")}</span>
            <input
              type="checkbox"
              checked={notificationPreferences.enabled}
              onChange={(e) =>
                financeActions.setNotificationPreferences({
                  ...notificationPreferences,
                  enabled: e.target.checked,
                })
              }
              className="size-4"
            />
          </label>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-mut">
              {t("advanceNotice")}
            </Label>
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
                <SelectValue placeholder={t("selectAdvance")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 bg-popover/95 p-1 shadow-xl backdrop-blur-xl">
                <SelectItem value="0" className="rounded-lg py-2.5 text-sm">
                  {t("onlyDue")}
                </SelectItem>
                <SelectItem value="1" className="rounded-lg py-2.5 text-sm">
                  {t("oneDay")}
                </SelectItem>
                <SelectItem value="2" className="rounded-lg py-2.5 text-sm">
                  {t("twoDays")}
                </SelectItem>
                <SelectItem value="3" className="rounded-lg py-2.5 text-sm">
                  {t("threeDays")}
                </SelectItem>
                <SelectItem value="7" className="rounded-lg py-2.5 text-sm">
                  {t("sevenDays")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="glass-soft flex items-center justify-between rounded-xl px-3 py-3 text-xs">
            <span>{t("dueToday")}</span>
            <input
              type="checkbox"
              checked={notificationPreferences.dueToday}
              disabled={!notificationPreferences.enabled}
              onChange={(e) =>
                financeActions.setNotificationPreferences({
                  ...notificationPreferences,
                  dueToday: e.target.checked,
                })
              }
              className="size-4"
            />
          </label>
          <label className="glass-soft flex items-center justify-between rounded-xl px-3 py-3 text-xs">
            <span>{t("overdueNotice")}</span>
            <input
              type="checkbox"
              checked={notificationPreferences.overdue}
              disabled={!notificationPreferences.enabled}
              onChange={(e) =>
                financeActions.setNotificationPreferences({
                  ...notificationPreferences,
                  overdue: e.target.checked,
                })
              }
              className="size-4"
            />
          </label>

          <div className="pt-2 border-t border-border/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <Smartphone className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-semibold">{t("pushNotificationTitle")}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-mut">
                  {t("pushNotificationDesc")}
                </p>
              </div>
            </div>

            {pushPermission !== "granted" ? (
              <button
                type="button"
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  setPushPermission(perm);
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 text-[11px] font-semibold uppercase tracking-wider text-background transition-colors hover:bg-brand/90"
              >
                <Bell className="size-3.5" />
                {t("pushNotificationEnable")}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-pos/10 px-3 py-2 text-xs text-pos">
                  <Check className="size-3.5" />
                  <span>{t("pushNotificationEnabled")}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const sent = await sendNativeBillNotification(
                      "FinMonth — Lembrete de Teste",
                      "Suas notificações nativas estão funcionando com sucesso!",
                    );
                    if (sent) setPushTestMessage(t("pushNotificationTestSuccess"));
                  }}
                  className="glass-soft flex h-9 w-full items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-medium text-foreground transition-colors hover:text-brand"
                >
                  <Send className="size-3.5" />
                  {t("pushNotificationTest")}
                </button>
                {pushTestMessage && (
                  <p className="text-center text-[10px] text-pos font-medium">
                    {pushTestMessage}
                  </p>
                )}
              </div>
            )}
            {pushPermission === "denied" && (
              <p className="rounded-xl bg-neg/10 px-3 py-2 text-[10px] leading-relaxed text-neg">
                {t("pushNotificationDenied")}
              </p>
            )}
          </div>
        </section>
      )}

      <p className="pt-1 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-mut/70">
        FinMonth v{__FINMONTH_VERSION__}
      </p>
    </section>
  );
}
