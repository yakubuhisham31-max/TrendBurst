import { useState, useEffect, useRef } from "react";
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
import { uploadToR2, createPreviewURL } from "@/lib/uploadToR2";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { checkAuth } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
    };
  }, [profilePreviewUrl]);

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Revoke old preview URL if exists
    if (profilePreviewUrl) {
      URL.revokeObjectURL(profilePreviewUrl);
    }

    // Create preview URL
    const preview = createPreviewURL(file);
    setProfilePreviewUrl(preview);
    setSelectedProfileFile(file);
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      // Register the user first (without profile picture)
      const response = await apiRequest("POST", "/api/auth/register", {
        username,
        email,
        password,
        bio,
      });
      
      // Check auth to load the newly created user
      await checkAuth();
      
      // Upload profile picture to R2 if a new file was selected
      let profilePictureUrl;
      if (selectedProfileFile) {
        profilePictureUrl = await uploadToR2(selectedProfileFile, 'profile-pictures');
      }
      
      // Update user profile with picture URL if uploaded
      if (profilePictureUrl) {
        await apiRequest("PATCH", "/api/users/profile", {
          profilePicture: profilePictureUrl,
        });
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // Clean up preview URL
      if (profilePreviewUrl) {
        URL.revokeObjectURL(profilePreviewUrl);
        setProfilePreviewUrl("");
      }
      setSelectedProfileFile(null);
      
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
                <AvatarImage src={profilePreviewUrl || undefined} alt={username} />
                <AvatarFallback>
                  {username ? username.slice(0, 2).toUpperCase() : <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              {profilePreviewUrl && (
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
              {profilePreviewUrl ? "Change Picture" : "Upload Profile Picture"}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureSelect}
              className="hidden"
              data-testid="input-profile-picture"
            />
            {profilePreviewUrl && (
              <p className="text-xs text-muted-foreground">
                Preview - click "Create Account" to upload
              </p>
            )}
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
