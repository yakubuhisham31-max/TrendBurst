import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthModal({ 
  isOpen, 
  onOpenChange,
  title = "Join Trendx to Continue",
  description = "Sign in or create an account to access this feature"
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState("login");
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [otpExpired, setOtpExpired] = useState(false);
  const { toast } = useToast();

  // Feature flag: show development OTP in the UI only when enabled via VITE_SHOW_DEV_OTP
  const showDevOtp = (import.meta as any).env?.VITE_SHOW_DEV_OTP === "true";

  // Timer effect for OTP countdown
  useEffect(() => {
    if (!showOTPVerification || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setOtpExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showOTPVerification, timeLeft]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: loginInput, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      toast({ title: "Success!", description: "You're now signed in" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid username/email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Please accept terms",
        description: "You must agree to the Terms and Conditions to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: registerUsername,
          email: registerEmail,
          password: registerPassword 
        }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Register response:", data);
      toast({ title: "Check your email!", description: "We sent you a verification code" });
      setShowOTPVerification(true);
      // Store dev OTP code if available and feature flag enabled
      if (showDevOtp && data.devOtpCode) {
        console.log("Setting dev OTP code:", data.devOtpCode);
        setDevOtpCode(data.devOtpCode);
      } else if (!showDevOtp && data.devOtpCode) {
        console.debug("Dev OTP present in response but VITE_SHOW_DEV_OTP is disabled.");
      }
    } catch (error: any) {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Could not create account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast({ title: "Enter OTP", description: "Please enter the verification code", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          code: otpCode,
          username: registerUsername,
          password: registerPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "OTP verification failed");
      }

      toast({ title: "Success!", description: "Account created! You're now signed in" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
      setShowNotificationModal(true);
    } catch (error: any) {
      toast({
        title: "OTP verification failed",
        description: error.message || "Invalid code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend OTP");
      }

      const data = await response.json();
      toast({ title: "Code sent!", description: "We sent you a new verification code" });
      setOtpCode("");
      setTimeLeft(180);
      setOtpExpired(false);
      if (showDevOtp && data.devOtpCode) {
        setDevOtpCode(data.devOtpCode);
      }
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Could not resend OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationModalClose = () => {
    setShowNotificationModal(false);
    // Reload after notification modal is done
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{showOTPVerification ? "Verify Email" : title}</DialogTitle>
          <DialogDescription>{showOTPVerification ? "Enter the 6-digit code sent to your email" : description}</DialogDescription>
        </DialogHeader>

        {showOTPVerification ? (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* Timer Circle */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200 dark:text-gray-700" />
                  {/* Progress circle */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="54" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeDasharray={`${(timeLeft / 180) * 339.29} 339.29`}
                    className={`transition-all duration-1000 ${otpExpired ? 'text-red-500' : timeLeft < 60 ? 'text-orange-500' : 'text-cyan-500'}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold tabular-nums ${otpExpired ? 'text-red-600 dark:text-red-400' : timeLeft < 60 ? 'text-orange-600 dark:text-orange-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">expires in</span>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              <Label htmlFor="otp-code" className="text-sm font-semibold block">Enter Verification Code</Label>
              <Input
                id="otp-code"
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                data-testid="input-otp-code"
                disabled={otpExpired}
                className="text-center text-2xl tracking-widest font-bold py-6"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Check your email for the 6-digit code</p>
            </div>

            {/* Dev OTP Code */}
            {showDevOtp && devOtpCode && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg text-center">
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">Development Mode</p>
                <p className="text-2xl text-blue-600 dark:text-blue-300 font-mono font-bold tracking-widest">{devOtpCode}</p>
              </div>
            )}

            {/* Action Buttons */}
            {otpExpired ? (
              <div className="space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-center">
                  <p className="text-xs text-red-600 dark:text-red-300 font-semibold">Code expired</p>
                </div>
                <Button type="button" onClick={handleResendOTP} className="w-full" disabled={isLoading} data-testid="button-resend-otp">
                  {isLoading ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            ) : (
              <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={isLoading || !otpCode} data-testid="button-verify-otp">
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            )}
            
            <Button type="button" variant="outline" className="w-full" onClick={() => {
              setShowOTPVerification(false);
              setOtpCode("");
              setDevOtpCode(null);
              setTimeLeft(180);
              setOtpExpired(false);
            }}>
              Back
            </Button>
          </form>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-input" className="text-sm">Username or Email</Label>
                <Input
                  id="login-input"
                  type="text"
                  placeholder="username@example.com"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value.replace(/\s/g, ''))}
                  data-testid="input-login-username-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm">Password</Label>
                <PasswordInput
                  id="login-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-login-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="button-sign-in"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username" className="text-sm">Username</Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="@username"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value.replace(/\s/g, ''))}
                  data-testid="input-register-username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  data-testid="input-register-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm">Password</Label>
                <PasswordInput
                  id="register-password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  data-testid="input-register-password"
                  required
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-modal"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  data-testid="checkbox-terms-modal"
                />
                <Label 
                  htmlFor="terms-modal" 
                  className="text-xs text-muted-foreground cursor-pointer font-normal leading-relaxed"
                >
                  I agree to Trendx's{" "}
                  <a 
                    href="/terms" 
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-terms-modal"
                  >
                    Terms and Conditions
                  </a>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="button-sign-up"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>

      {/* Notification Permission Modal */}
      <NotificationPermissionModal 
        isOpen={showNotificationModal}
        onOpenChange={handleNotificationModalClose}
      />
    </Dialog>
  );
}
