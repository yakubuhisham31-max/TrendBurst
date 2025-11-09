import { BadgeCheck } from "lucide-react";

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
  if (!verified || verified === 0) return null;

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <BadgeCheck 
      className={`inline-block text-blue-500 fill-blue-500 ${sizeClasses[size]} ${className}`}
      aria-label="Verified account"
      data-testid="badge-verified"
    />
  );
}
