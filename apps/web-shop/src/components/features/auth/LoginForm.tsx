"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password. Please try again.");
      } else {
        window.location.assign(callbackUrl);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-surface-container-low rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-outline-variant/30 my-8">
      {/* Left Column: Editorial Image */}
      <div className="hidden md:block w-1/2 relative bg-surface-container min-h-[480px]">
        <Image
          src="https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80"
          alt="Artisanal Ube Product"
          fill
          unoptimized
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary-dark/30 to-transparent flex flex-col justify-end p-10">
          <h2 className="font-serif text-3xl font-normal text-white mb-2">Welcome Back</h2>
          <p className="font-sans text-sm text-white/90 leading-relaxed">
            Continue your journey in artisanal elegance with fresh Baguio Ube treats.
          </p>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-surface-container-lowest">
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal mb-2">Sign In</h1>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant">
            Enter your details to access your account.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-2xl bg-error-container/30 border border-error-container text-on-error-container text-xs font-medium">
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 font-sans">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="hello@example.com"
                      className="rounded-full px-5 py-3 bg-surface border-outline-variant/40 focus:border-primary text-on-surface"
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
                  <div className="flex justify-between items-center mb-1">
                    <FormLabel className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="rounded-full px-5 py-3 pr-11 bg-surface border-outline-variant/40 focus:border-primary text-on-surface"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-1"
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full py-3.5 bg-primary text-on-primary font-semibold hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-2 mt-6"
            >
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </Form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center font-sans">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline ml-1">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
