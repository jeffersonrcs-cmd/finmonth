import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "FinMês — Criar nova senha" },
      {
        name: "description",
        content: "Crie uma nova senha para recuperar o acesso à sua conta do FinMês.",
      },
    ],
  }),
  component: ResetPasswordScreen,
});
