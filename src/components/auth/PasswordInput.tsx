import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui";

type PasswordInputProps = {
  autoComplete?: string;
  label?: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function PasswordInput({
  autoComplete = "current-password",
  label = "Senha",
  name = "password",
  onChange,
  placeholder = "Sua senha",
  value,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        autoComplete={autoComplete}
        label={label}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type={isVisible ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute bottom-0 right-2 grid h-12 w-10 place-items-center text-zinc-400 transition hover:text-white"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? (
          <EyeOff aria-hidden="true" className="h-5 w-5" />
        ) : (
          <Eye aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
