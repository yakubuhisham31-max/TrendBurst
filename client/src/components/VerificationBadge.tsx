import { Check } from "lucide-react";

interface VerificationBadgeProps {
  verified?: number | boolean | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function VerificationBadge({ 
  verified, 
  size = "md",
  className = "" 
}: VerificationBadgeProps) {
  if (!verified || verified === 0) {
    return null;
  }

  // Instagram-style verification badge
  const containerClasses = {
    sm: "inline-flex items-center justify-center w-4 h-4",
    md: "inline-flex items-center justify-center w-5 h-5",
    lg: "inline-flex items-center justify-center w-6 h-6"
  };

  const iconClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5"
  };

  return (
    <div 
      className={`${containerClasses[size]} bg-blue-500 rounded-full ${className}`}
      aria-label="Verified account"
      data-testid="badge-verified"
      title="Verified Account"
    >
      <Check 
        className={`${iconClasses[size]} text-white`}
        strokeWidth={3}
      />
    </div>
  );
}
