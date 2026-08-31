import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, X } from "lucide-react";

interface ResumeUploadFieldProps {
  file: File | null;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

export function ResumeUploadField({
  file,
  isSubmitting,
  fileInputRef,
  onFileChange,
  onRemoveFile,
}: ResumeUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-slate-700">
        Resume / CV <span className="text-rose-500">*</span>
      </Label>

      {file ? (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-violet-100 bg-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          {!isSubmitting && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemoveFile}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !isSubmitting && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50/30 transition-all duration-300 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:text-violet-500 transition-colors duration-300" />
          <p className="text-sm font-bold text-slate-800">Click to upload your resume</p>
          <p className="text-xs text-slate-500 mt-1">Supports PDF, DOC, or DOCX up to 5MB</p>
        </div>
      )}
    </div>
  );
}
