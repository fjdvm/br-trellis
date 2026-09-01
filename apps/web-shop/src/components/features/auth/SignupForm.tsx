"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/validators/auth";
import { authApi } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await authApi.register({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      // Instead of dropping the shopper straight onto sign-in, tell them to go
      // confirm their email. They can only log in after clicking the link.
      setRegisteredEmail(data.email.trim());
    } catch (err: unknown) {
      const apiErr = err as { data?: { detail?: string; errors?: Record<string, string[]> } };
      if (apiErr?.data?.detail) {
        setServerError(apiErr.data.detail);
      } else if (apiErr?.data?.errors) {
        const firstErrorKey = Object.keys(apiErr.data.errors)[0];
        setServerError(apiErr.data.errors[firstErrorKey][0]);
      } else {
        setServerError("Registration failed. Please check your information and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <section className="w-full max-w-lg">
        <Card className="border border-border/70 shadow-xl bg-surface-card overflow-hidden">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MailCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary mb-2">Check your email</CardTitle>
            <CardDescription className="text-sm text-on-surface-variant">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{registeredEmail}</span>. Click the link
              in that email to verify your account before signing in.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-on-surface-variant text-center">
              Didn&apos;t get it? Check your spam folder, or the confirmation link may take a moment to
              arrive.
            </p>
          </CardContent>

          <CardFooter className="justify-center border-t border-border/50 pt-6">
            <Button
              type="button"
              onClick={() => router.push("/signin")}
              className="w-full bg-primary text-white hover:bg-primary-dark shadow-md cursor-pointer"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full max-w-lg">
      <Card className="border border-border/70 shadow-xl bg-surface-card overflow-hidden">
        <CardHeader className="flex flex-col items-center text-center">
          <Image
            src="/logo.jpeg"
            alt="Bren Raphael's Logo"
            width={64}
            height={64}
            className="w-16 h-16 object-cover shadow-sm mb-4"
          />
          <CardTitle className="text-3xl font-bold text-primary mb-2">Bren Raphael&apos;s</CardTitle>
          <CardDescription className="text-sm text-on-surface-variant">
            Create an account to track orders and save your details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm">
              {serverError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input id="signup-name" type="text" placeholder="John Doe" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input id="signup-email" type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-foreground transition-colors p-1"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
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
                        <div className="relative">
                          <Input
                            id="signup-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-foreground transition-colors p-1"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                    <FormControl>
                      <input
                        id="terms"
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1 w-4 h-4 border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-normal text-on-surface-variant cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary underline">
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white hover:bg-primary-dark shadow-md mt-4 cursor-pointer"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="justify-center border-t border-border/50 pt-6">
          <p className="text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
