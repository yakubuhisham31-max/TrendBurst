import { BadgeCheck } from "lucide-react";

interface VerificationBadgeProps {
  verified?: number | boolean | null;
  size?: "sm" | "md" | "lg";
  variant?: "minimal" | "badge";
  className?: string;
}

export default function VerificationBadge({ 
  verified, 
  size = "md",
  variant = "badge",
  className = "" 
}: VerificationBadgeProps) {
  if (!verified || verified === 0) {
    return null;
  }

  if (variant === "minimal") {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5"
    };

    return (
      <BadgeCheck 
        className={`inline-block text-blue-500 ${sizeClasses[size]} ${className}`}
        fill="currentColor"
        aria-label="Verified account"
        data-testid="badge-verified"
      />
    );
  }

  // Badge variant with background
  const containerClasses = {
    sm: "inline-flex items-center justify-center w-5 h-5 rounded-full",
    md: "inline-flex items-center justify-center w-6 h-6 rounded-full",
    lg: "inline-flex items-center justify-center w-7 h-7 rounded-full"
  };

  const iconClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4"
  };

  return (
    <div 
      className={`${containerClasses[size]} bg-blue-500 shadow-md dark:shadow-blue-500/20 ${className}`}
      aria-label="Verified account"
      data-testid="badge-verified"
      title="Verified Account"
    >
      <BadgeCheck 
        className={`${iconClasses[size]} text-white`}
        fill="white"
      />
    </div>
  );
}
