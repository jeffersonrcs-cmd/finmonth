import { useSyncExternalStore } from "react";

export const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)", nativeLabel: "Português" },
  { code: "en-US", label: "English (United States)", nativeLabel: "English" },
  { code: "es-ES", label: "Español (España)", nativeLabel: "Español" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
const STORAGE_KEY = "finmonth.language";
const DEFAULT_LANGUAGE: LanguageCode = "pt-BR";
const translations = {
  "pt-BR": { settings:"Configurações", settingsDescription:"Gerencie sua conta e as preferências do aplicativo.", profile:"Editar dados do usuário", notifications:"Notificações", language:"Linguagem", languageDescription:"Escolha o idioma usado pelo aplicativo.", themeLight:"Tema claro", themeDark:"Tema escuro", version:"Versão", signOut:"Sair da conta", back:"Voltar", chooseLanguage:"Escolha seu idioma", chooseLanguageDescription:"A preferência fica salva neste dispositivo.", selectedLanguage:"Idioma selecionado", home:"Início", bills:"Contas", incomes:"Receitas", savings:"Guardado", finai:"FinAI" },
  "en-US": { settings:"Settings", settingsDescription:"Manage your account and app preferences.", profile:"Edit user data", notifications:"Notifications", language:"Language", languageDescription:"Choose the language used by the app.", themeLight:"Light theme", themeDark:"Dark theme", version:"Version", signOut:"Sign out", back:"Back", chooseLanguage:"Choose your language", chooseLanguageDescription:"Your preference is saved on this device.", selectedLanguage:"Selected language", home:"Home", bills:"Bills", incomes:"Income", savings:"Saved", finai:"FinAI" },
  "es-ES": { settings:"Configuración", settingsDescription:"Administra tu cuenta y las preferencias de la aplicación.", profile:"Editar datos del usuario", notifications:"Notificaciones", language:"Idioma", languageDescription:"Elige el idioma utilizado por la aplicación.", themeLight:"Tema claro", themeDark:"Tema oscuro", version:"Versión", signOut:"Cerrar sesión", back:"Volver", chooseLanguage:"Elige tu idioma", chooseLanguageDescription:"Tu preferencia se guarda en este dispositivo.", selectedLanguage:"Idioma seleccionado", home:"Inicio", bills:"Cuentas", incomes:"Ingresos", savings:"Guardado", finai:"FinAI" },
} as const;

type TranslationKey = keyof (typeof translations)["pt-BR"];
let language: LanguageCode = DEFAULT_LANGUAGE;
let hydrated = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((listener) => listener()); }
function detectLanguage(): LanguageCode {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const preferred = navigator.language.toLowerCase();
  if (preferred.startsWith("en")) return "en-US";
  if (preferred.startsWith("es")) return "es-ES";
  return DEFAULT_LANGUAGE;
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    language = LANGUAGES.some((item) => item.code === stored) ? (stored as LanguageCode) : detectLanguage();
  } catch { language = detectLanguage(); }
  document.documentElement.lang = language;
}
export function setLanguage(next: LanguageCode) {
  language = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  if (typeof document !== "undefined") document.documentElement.lang = next;
  emit();
}
function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
const getSnapshot = () => language;
const getServerSnapshot = () => DEFAULT_LANGUAGE;
export function useLanguage() {
  hydrate();
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { language: current, setLanguage, t: (key: TranslationKey) => translations[current][key] };
}
