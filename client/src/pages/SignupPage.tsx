import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState<string>();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      console.error("Passwords don't match");
      return;
    }

    console.log("Signup attempt:", {
      username,
      email,
      password,
      bio,
      profilePic,
    });
    
    setLocation("/onboarding/categories");
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
            <Avatar className="w-24 h-24" data-testid="avatar-preview">
              <AvatarImage src={profilePic} alt={username} />
              <AvatarFallback>
                {username ? username.slice(0, 2).toUpperCase() : <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => console.log("Upload profile picture")}
              data-testid="button-upload-avatar"
            >
              <Upload className="w-4 h-4" />
              Upload Profile Picture
            </Button>
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
            data-testid="button-signup"
          >
            Sign Up
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
