import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";
import { useEffect } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 sm:p-10 space-y-8">
        <div className="text-center space-y-4">
          <img 
            src={logoImage} 
            alt="Trendz" 
            className="h-24 sm:h-32 mx-auto object-contain"
            data-testid="img-logo"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Sign in to discover and join trending challenges
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username or email"
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
                    <PasswordInput
                      placeholder="Enter your password"
                      data-testid="input-password"
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
              data-testid="button-login"
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-semibold"
              data-testid="link-signup"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
