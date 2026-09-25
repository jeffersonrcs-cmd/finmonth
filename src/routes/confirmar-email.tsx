import { createFileRoute } from "@tanstack/react-router";
import { ConfirmEmailScreen } from "@/components/auth/ConfirmEmailScreen";

export const Route = createFileRoute("/confirmar-email")({
  head: () => ({
    meta: [
      { title: "FinMonth — Confirmar e-mail" },
      { name: "description", content: "Confirme seu e-mail para ativar sua conta do FinMonth." },
    ],
  }),
  component: ConfirmEmailScreen,
});
