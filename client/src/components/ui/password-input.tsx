import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export const PasswordInput = ({
  placeholder = "Enter password",
  ...props
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        {...props}
        className="pr-10"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        data-testid="button-toggle-password"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Eye className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};
