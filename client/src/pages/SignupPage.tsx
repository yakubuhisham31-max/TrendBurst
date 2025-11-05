import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Check } from "lucide-react";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadToR2 } from "@/lib/uploadToR2";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { checkAuth } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB for profile pictures)
    if (file.size > 5242880) {
      toast({
        title: "File too large",
        description: "Profile picture must be under 5MB",
        variant: "destructive",
      });
      return;
    }

    // Revoke old preview URL if it exists
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    // Create new preview URL
    const preview = URL.createObjectURL(file);
    previewUrlRef.current = preview;
    setProfilePicFile(file);
    setProfilePicPreview(preview);
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      // Upload profile picture if selected
      let profilePictureUrl: string | undefined = undefined;
      if (profilePicFile) {
        profilePictureUrl = await uploadToR2(profilePicFile, "profile-pictures");
      }

      // Register the user
      const response = await apiRequest("POST", "/api/auth/register", {
        username,
        email,
        password,
        bio,
        profilePicture: profilePictureUrl,
      });
      return response.json();
    },
    onSuccess: async () => {
      // Revoke preview URL after successful upload
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      
      // Check auth to load the user
      await checkAuth();
      
      // Navigate to category selection
      setLocation("/onboarding/categories");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
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
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24" data-testid="avatar-preview">
                <AvatarImage src={profilePicPreview} alt={username} />
                <AvatarFallback>
                  {username ? username.slice(0, 2).toUpperCase() : <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              {profilePicFile && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-avatar"
            >
              <Upload className="w-4 h-4" />
              {profilePicFile ? "Change Picture" : "Upload Profile Picture"}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-profile-picture"
            />
          </div>

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
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              data-testid="input-confirm-password"
            />
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
      </Card>
    </div>
  );
}
