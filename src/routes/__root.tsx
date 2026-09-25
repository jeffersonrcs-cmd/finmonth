import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

const BUILD_ID = __FINMONTH_BUILD_ID__;
const APP_VERSION = __FINMONTH_VERSION__;

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { connectCloud, disconnectCloud, hydrateStore, useFinanceState } from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { checkAndSendDueAlerts } from "@/lib/notifications";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {useLanguage().t("pageNotFound")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {useLanguage().t("pageNotFoundDescription")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {useLanguage().t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {useLanguage().t("pageDidNotLoad")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {useLanguage().t("somethingWentWrong")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {useLanguage().t("tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {useLanguage().t("goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  headers: () => ({
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
  }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "FinMonth — Controle financeiro pessoal" },
      {
        name: "description",
        content: "Controle suas receitas, contas e economias mês a mês.",
      },
      { name: "theme-color", content: "#0b0f19" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "FinMonth" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "finmonth-build", content: BUILD_ID },
      { name: "finmonth-version", content: APP_VERSION },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { theme } = useFinanceState();
  const { language, t } = useLanguage();
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const publicAuthRoutes = ["/confirmar-email", "/redefinir-senha"] as const;
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isPublicAuthRoute = publicAuthRoutes.includes(
    currentPath as (typeof publicAuthRoutes)[number],
  );

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isRecoveryFlow = hashParams.get("type") === "recovery";
    const isLocalHost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isRecoveryFlow && isLocalHost) {
      const productionRecoveryUrl = new URL("https://finmonth.github.io/redefinir-senha");
      productionRecoveryUrl.hash = window.location.hash.replace(/^#/, "");
      window.location.replace(productionRecoveryUrl.toString());
      return;
    }

    hydrateStore();
    let active = true;
    let connectedUserId: string | null = null;

    const applySession = async (session: { user: { id: string } } | null) => {
      if (!active) return;
      if (!session) {
        connectedUserId = null;
        setAuthenticated(false);
        setAuthReady(true);
        return;
      }

      if (connectedUserId === session.user.id) {
        setAuthenticated(true);
        setAuthReady(true);
        return;
      }

      setAuthReady(false);
      try {
        await connectCloud(session.user.id);
        connectedUserId = session.user.id;
        if (active) setAuthenticated(true);
      } catch (error: any) {
        console.error("Não foi possível carregar os dados do usuário.", error);
        // If error is related to JWT clock skew or transient network, keep the user session
        // instead of abruptly logging them out, allowing retry on next interaction
        if (error?.code === "PGRST303" || error?.message?.includes("future")) {
          connectedUserId = session.user.id;
          if (active) setAuthenticated(true);
        } else {
          if (active) setAuthenticated(false);
        }
      } finally {
        if (active) setAuthReady(true);
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    let lastSessionRecovery = 0;
    let recoveryInFlight = false;

    const recoverSession = async () => {
      if (!active || recoveryInFlight || document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastSessionRecovery < 30_000) return;

      lastSessionRecovery = now;
      recoveryInFlight = true;

      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session) {
          await applySession(data.session);
          return;
        }

        // A temporary network/Safari wake-up failure must not log the user out.
        // Keep the current authenticated state and let Supabase retry on the next
        // visibility/foreground event.
        if (error) {
          const { data: current } = await supabase.auth.getSession();
          if (current.session) await applySession(current.session);
        }
      } finally {
        recoveryInFlight = false;
      }
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        disconnectCloud();
        setAuthenticated(false);
        setAuthReady(true);
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setTimeout(() => void applySession(session), 0);
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void recoverSession();
    };
    const handlePageShow = () => {
      void recoverSession();
    };
    const handleOnline = () => {
      void recoverSession();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const checkForUpdate = async () => {
      try {
        const checkUrl = new URL(window.location.href);
        checkUrl.searchParams.set("finmonth-check", Date.now().toString());
        const response = await fetch(checkUrl.toString(), {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, max-age=0" },
        });
        if (!response.ok) return;
        const html = await response.text();
        const buildMatch = html.match(
          /<meta[^>]+name=["']finmonth-build["'][^>]+content=["']([^"']+)["']/i,
        );
        const versionMatch = html.match(
          /<meta[^>]+name=["']finmonth-version["'][^>]+content=["']([^"']+)["']/i,
        );
        const newerBuildAvailable = Boolean(buildMatch?.[1] && buildMatch[1] !== BUILD_ID);
        const newerVersionAvailable = Boolean(versionMatch?.[1] && versionMatch[1] !== APP_VERSION);
        if (active && (newerBuildAvailable || newerVersionAvailable)) {
          window.dispatchEvent(new CustomEvent("finmonth:update-available"));
        }
      } catch {
        // A failed version check must never interrupt normal app usage.
      }
    };

    void checkForUpdate();
    const interval = window.setInterval(checkForUpdate, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const financeState = useFinanceState();

  // Register PWA service worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for service worker updates
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              };
            }
          };
        })
        .catch(() => {
          /* ignore registration errors */
        });
    }
  }, []);

  // Check and trigger notifications if user has enabled alerts
  useEffect(() => {
    if (authenticated) {
      const timer = setTimeout(() => {
        void checkAndSendDueAlerts(financeState, t);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authenticated, financeState.notificationPreferences.enabled]);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener("finmonth:update-available", handleUpdate);
    return () => window.removeEventListener("finmonth:update-available", handleUpdate);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {updateAvailable && (
        <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-[420px] rounded-2xl border border-brand/25 bg-popover/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">{t("newVersion")}</p>
              <p className="mt-0.5 text-[11px] text-mut">{t("updateLatest")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const updateUrl = new URL(window.location.href);
                updateUrl.searchParams.set("finmonth-update", Date.now().toString());
                window.location.replace(updateUrl.toString());
              }}
              className="shrink-0 rounded-xl bg-brand px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-background"
            >
              Atualizar
            </button>
          </div>
        </div>
      )}
      {!authReady ? (
        <div className="flex min-h-screen items-center justify-center bg-background text-xs text-mut">
          {t("loadingData")}
        </div>
      ) : authenticated || isPublicAuthRoute ? (
        <>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <Toaster position="top-center" />
        </>
      ) : (
        <AuthScreen />
      )}
    </QueryClientProvider>
  );
}
