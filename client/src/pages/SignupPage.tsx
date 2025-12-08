import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [otpCode, setOtpCode] = useState("");

  const signupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/register", {
        username,
        email,
        password,
        bio,
      });
      return response.json();
    },
    onSuccess: async () => {
      setStep("otp");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        email,
        code: otpCode,
        username,
        password,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setLocation("/onboarding/categories");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    },
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Please accept terms",
        description: "You must agree to the Terms and Conditions to continue",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate();
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast({
        title: "Please enter code",
        description: "Enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate();
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-4">
            <img 
              src={logoImage} 
              alt="Trendz" 
              className="h-24 sm:h-32 mx-auto object-contain"
              data-testid="img-logo"
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Verify Your Email</h1>
              <p className="text-muted-foreground text-sm">
                We sent a 6-digit code to<br />
                <span className="font-medium">{email}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                maxLength={6}
                required
                data-testid="input-otp"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
              data-testid="button-verify-otp"
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setStep("signup")}
              className="text-sm text-primary hover:underline"
              data-testid="button-back-to-signup"
            >
              Back to signup
            </button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground" data-testid="text-copyright">
              © 2025 TrendX. All rights reserved.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-4">
          <img 
            src={logoImage} 
            alt="Trendz" 
            className="h-24 sm:h-32 mx-auto object-contain"
            data-testid="img-logo"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Join Trendx</h1>
            <p className="text-muted-foreground">
              Create your account and start trending
            </p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="input-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Status</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[80px]"
              data-testid="input-bio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <PasswordInput
              id="confirm-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              data-testid="input-confirm-password"
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              data-testid="checkbox-terms"
            />
            <Label 
              htmlFor="terms" 
              className="text-sm text-muted-foreground cursor-pointer font-normal leading-relaxed"
            >
              I agree to Trendx's{" "}
              <a 
                href="/terms" 
                className="text-primary hover:underline font-medium"
                data-testid="link-terms"
              >
                Terms and Conditions
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={signupMutation.isPending}
            data-testid="button-signup"
          >
            {signupMutation.isPending ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary hover:underline font-medium"
              data-testid="link-login"
            >
              Sign in
            </a>
          </p>
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground" data-testid="text-copyright">
            © 2025 TrendX. All rights reserved.
          </p>
        </div>
      </Card>
    </div>
  );
}
