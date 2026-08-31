import { UseFormReturn } from "react-hook-form";
import type { ProfileFormData } from "@/lib/validators/auth";
import type { UserDto } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfilePersonalTabProps {
  user: UserDto | null;
  form: UseFormReturn<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  successMessage: string | null;
  errorMessage: string | null;
}

export function ProfilePersonalTab({
  user,
  form,
  onSubmit,
  successMessage,
  errorMessage,
}: ProfilePersonalTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header / Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[var(--border)]">
        <Avatar className="w-20 h-20 border-2 border-[var(--primary)] text-2xl font-bold bg-[var(--primary-fixed)] text-[var(--primary)]">
          <AvatarFallback>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
          <p className="text-sm text-[var(--muted)]">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-0.5 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] text-xs font-semibold rounded-full">
            Artisanal Ube Enthusiast
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-[var(--error-container)] text-[var(--on-error-container)] text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="prof-name">Full Name</Label>
          <Input id="prof-name" type="text" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-xs text-[var(--error)]">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prof-email">Email Address</Label>
          <Input
            id="prof-email"
            type="email"
            disabled
            value={user?.email || ""}
            className="bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prof-phone">Phone Number</Label>
          <Input
            id="prof-phone"
            type="tel"
            placeholder="+63 917 123 4567"
            {...register("phoneNumber")}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-[var(--error)]">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div className="md:col-span-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--primary)] text-white px-8 py-3 rounded-full font-semibold text-sm shadow-md hover:bg-[var(--primary-dark)] transition-all cursor-pointer"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
