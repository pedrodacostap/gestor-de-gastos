import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { PasswordInput } from "../../components/auth/PasswordInput";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../context/auth/useAuth";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Entre para acessar seu painel protegido do Gestor de Gastos."
      title="Entrar"
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
        <PasswordInput onChange={setPassword} value={password} />

        {message && (
          <p className="rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
            {message}
          </p>
        )}

        <Button disabled={isSubmitting} isFullWidth type="submit">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-zinc-300">
        <Link className="block text-sky-300 hover:text-sky-200" to="/recuperar-senha">
          Esqueci minha senha
        </Link>
        <p>
          Ainda não tem conta?{" "}
          <Link className="text-sky-300 hover:text-sky-200" to="/cadastro">
            Criar cadastro
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
