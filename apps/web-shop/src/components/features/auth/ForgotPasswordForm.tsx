"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validators/auth";
import { authApi } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch {
      // Still show success for security
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-md">
      <Card className="border border-border/70 shadow-xl rounded-2xl bg-surface-card overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-[var(--primary)] mb-2">Reset Password</CardTitle>
          <CardDescription className="text-sm text-[var(--muted)]">
            Enter your account&apos;s email address and we&apos;ll send you password reset instructions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-[var(--surface-container)] text-[var(--primary)] text-sm font-medium">
                If an account exists with that email address, password reset instructions have been sent.
              </div>
              <Link
                href="/signin"
                className="inline-block mt-4 text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                &larr; Back to Sign in
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input id="forgot-email" type="email" placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] shadow-md mt-4 cursor-pointer"
                >
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        {!isSuccess && (
          <CardFooter className="justify-center border-t pt-6">
            <Link href="/signin" className="text-sm font-semibold text-[var(--primary)] hover:underline">
              &larr; Back to Sign in
            </Link>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
