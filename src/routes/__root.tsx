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

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { connectCloud, disconnectCloud, hydrateStore, useFinanceState } from "@/lib/finance";
import { supabase } from "@/lib/supabase";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FinMonth — Controle financeiro pessoal" },
      {
        name: "description",
        content: "Controle suas receitas, contas e economias mês a mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "finmonth-build", content: BUILD_ID },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
    <html lang="pt-BR">
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
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
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
      } catch (error) {
        console.error("Não foi possível carregar os dados do usuário.", error);
        if (active) setAuthenticated(false);
      } finally {
        if (active) setAuthReady(true);
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        disconnectCloud();
        setAuthenticated(false);
        setAuthReady(true);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        setTimeout(() => void applySession(session), 0);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
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
        const match = html.match(/<meta[^>]+name=["']finmonth-build["'][^>]+content=["']([^"']+)["']/i);
        if (active && match?.[1] && match[1] !== BUILD_ID) {
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
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const [updateAvailable, setUpdateAvailable] = useState(false);

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
              <p className="text-xs font-semibold text-foreground">Nova versão disponível</p>
              <p className="mt-0.5 text-[11px] text-mut">Atualize para usar a versão mais recente do FinMonth.</p>
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
          Carregando seus dados...
        </div>
      ) : authenticated ? (
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
