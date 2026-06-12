import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { PasswordInput } from "../../components/auth/PasswordInput";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../context/auth/useAuth";

export function SignUpPage() {
  const navigate = useNavigate();
  const { isConfigured, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await signUp(email, password);
      setMessage("Cadastro criado. Verifique seu e-mail se a confirmação estiver ativa.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Crie sua conta para preparar o ambiente seguro do aplicativo."
      title="Criar conta"
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
        <PasswordInput
          autoComplete="new-password"
          onChange={setPassword}
          placeholder="Crie uma senha segura"
          value={password}
        />

        {message && (
          <p className="rounded-lg border border-white/12 bg-white/8 p-3 text-sm text-zinc-100">
            {message}
          </p>
        )}

        <Button disabled={isSubmitting} isFullWidth type="submit">
          {isSubmitting ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-300">
        Já tem conta?{" "}
        <Link className="text-sky-300 hover:text-sky-200" to="/login">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
