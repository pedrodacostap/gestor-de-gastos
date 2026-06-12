import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../context/auth/useAuth";

export function ResetPasswordPage() {
  const { isConfigured, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setMessage("Enviamos as instruções de recuperação para seu e-mail.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a recuperação.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Informe seu e-mail para receber um link de recuperação de senha."
      title="Recuperar senha"
    >
      {!isConfigured && (
        <p className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          Configure as variáveis do Supabase antes de autenticar.
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          label="E-mail"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@email.com"
          required
          type="email"
          value={email}
        />

        {message && (
          <p className="rounded-lg border border-white/12 bg-white/8 p-3 text-sm text-zinc-100">
            {message}
          </p>
        )}

        <Button disabled={isSubmitting} isFullWidth type="submit">
          {isSubmitting ? "Enviando..." : "Enviar recuperação"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-300">
        Lembrou a senha?{" "}
        <Link className="text-sky-300 hover:text-sky-200" to="/login">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  );
}
