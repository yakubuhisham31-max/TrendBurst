import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Upload } from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function EditProfilePage() {
  const [, setLocation] = useLocation();
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    bio: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    youtube: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        bio: user.bio || "",
        instagram: user.instagramUrl || "",
        tiktok: user.tiktokUrl || "",
        twitter: user.twitterUrl || "",
        youtube: user.youtubeUrl || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiRequest("PATCH", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: async () => {
      await checkAuth();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setLocation("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const getFileExtension = (filename?: string, mimeType?: string): string => {
    if (filename) {
      const ext = filename.split('.').pop();
      if (ext && ext.length <= 4) return ext;
    }
    if (mimeType) {
      const typeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      return typeMap[mimeType] || 'jpg';
    }
    return 'jpg';
  };

  const handleGetUploadParameters = async (file: { name?: string; type?: string }) => {
    const ext = getFileExtension(file.name, file.type);
    const response = await apiRequest("POST", "/api/object-storage/upload-url", {
      path: `profile-pictures/${user?.id}-${Date.now()}.${ext}`,
      isPublic: true,
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadUrl = result.successful[0].uploadURL;
      
      try {
        const response = await apiRequest("PUT", "/api/users/profile-picture", {
          profilePictureUrl: uploadUrl,
        });
        const data = await response.json();
        
        await checkAuth();
        
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update profile picture.",
          variant: "destructive",
        });
      }
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      bio: formData.bio,
      instagramUrl: formData.instagram,
      tiktokUrl: formData.tiktok,
      twitterUrl: formData.twitter,
      youtubeUrl: formData.youtube,
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/profile")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="w-20 h-20" data-testid="avatar-profile">
                <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
                <AvatarFallback className="text-xl">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                variant="outline"
                buttonClassName="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </ObjectUploader>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  placeholder="Enter username"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Enter your full name"
                  data-testid="input-fullname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  rows={4}
                  data-testid="input-bio"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <SiInstagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  placeholder="https://instagram.com/username"
                  data-testid="input-instagram"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok" className="flex items-center gap-2">
                  <SiTiktok className="w-4 h-4" />
                  TikTok
                </Label>
                <Input
                  id="tiktok"
                  value={formData.tiktok}
                  onChange={(e) =>
                    setFormData({ ...formData, tiktok: e.target.value })
                  }
                  placeholder="https://tiktok.com/@username"
                  data-testid="input-tiktok"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <SiX className="w-4 h-4" />
                  Twitter (X)
                </Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  placeholder="https://twitter.com/username"
                  data-testid="input-twitter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <SiYoutube className="w-4 h-4" />
                  YouTube
                </Label>
                <Input
                  id="youtube"
                  value={formData.youtube}
                  onChange={(e) =>
                    setFormData({ ...formData, youtube: e.target.value })
                  }
                  placeholder="https://youtube.com/@username"
                  data-testid="input-youtube"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/profile")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              data-testid="button-save"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        <form onSubmit={handlePasswordChange} className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Enter new password (min 6 characters)"
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                data-testid="button-change-password"
                disabled={
                  !passwordData.currentPassword || 
                  !passwordData.newPassword || 
                  !passwordData.confirmPassword ||
                  changePasswordMutation.isPending
                }
              >
                {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
