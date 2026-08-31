import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ApplicantFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  coverLetter: string;
  setCoverLetter: (v: string) => void;
  isSubmitting: boolean;
}

export function ApplicantFormFields({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  coverLetter,
  setCoverLetter,
  isSubmitting,
}: ApplicantFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="applicant-name" className="text-xs font-bold text-slate-700">
            Full Name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="applicant-name"
            placeholder="e.g. Juan dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="rounded-xl border-slate-200 text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="applicant-email" className="text-xs font-bold text-slate-700">
            Email Address <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="applicant-email"
            type="email"
            placeholder="e.g. juan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="rounded-xl border-slate-200 text-slate-900"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="applicant-phone" className="text-xs font-bold text-slate-700">
          Phone Number <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="applicant-phone"
          placeholder="e.g. +63 917 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          className="rounded-xl border-slate-200 text-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="applicant-cover" className="text-xs font-bold text-slate-700">
          Cover Letter / Brief Intro
        </Label>
        <Textarea
          id="applicant-cover"
          placeholder="Tell us briefly why you are a great fit..."
          rows={3}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          disabled={isSubmitting}
          className="rounded-xl border-slate-200 text-slate-900"
        />
      </div>
    </>
  );
}
