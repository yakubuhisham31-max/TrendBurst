import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";
import logoImage from "@assets/file_000000003b9861f58e6c60daa28b8f45_1761404274206.png";
import { useEffect } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  profilePicture: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register: registerUser, user } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      profilePicture: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        profilePicture: data.profilePicture,
      });
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      setLocation("/onboarding/categories");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/object-storage/upload-url", {
      path: `profile-pictures/${Date.now()}.jpg`,
      isPublic: true,
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadedUrl = result.successful[0].uploadURL.split('?')[0];
      form.setValue("profilePicture", uploadedUrl);
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      });
    }
  };

  const profilePicture = form.watch("profilePicture");
  const username = form.watch("username");

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-24 h-24" data-testid="avatar-preview">
                <AvatarImage src={profilePicture} alt={username} />
                <AvatarFallback>
                  {username ? username.slice(0, 2).toUpperCase() : <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={getUploadParameters}
                onComplete={handleUploadComplete}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Profile Picture
              </ObjectUploader>
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      data-testid="input-fullname"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      data-testid="input-email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Choose a username"
                      data-testid="input-username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      data-testid="input-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      data-testid="input-confirm-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
              data-testid="button-register"
            >
              {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </Form>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
              data-testid="link-login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
