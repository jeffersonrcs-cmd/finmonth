import { createFileRoute } from "@tanstack/react-router";
import { ConfirmEmailScreen } from "@/components/auth/ConfirmEmailScreen";

export const Route = createFileRoute("/confirmar-email")({
  head: () => ({
    meta: [
      { title: "FinMonth — Criar senha" },
      { name: "description", content: "Crie a senha da sua conta após a aprovação do cadastro." },
    ],
  }),
  component: ConfirmEmailScreen,
});
