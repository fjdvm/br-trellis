import React, { useRef, useState } from "react";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Input as UIInput } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Textarea as UITextarea } from "@/components/ui/textarea";

export function BlockGroup({
  label,
  type,
  required,
  children,
}: {
  label: string;
  type: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const typeColors: Record<string, string> = {
    button: "bg-primary/10 text-primary border-primary/20",
    image: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    link: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    carousel: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  const badgeClass = typeColors[type] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="space-y-3 border border-border/70 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}`}>
          {type}
        </span>
      </div>
      {children}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  required,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-sm border border-border/70 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <UILabel htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </UILabel>
      </div>
      <UIInput
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function SubTextField({
  id,
  label,
  value,
  required,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <UILabel htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </UILabel>
      </div>
      <UIInput
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function RichTextEditorField({
  id,
  label,
  value,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  function applyFormatting(wrap: "**" | "*") {
    const textarea = textareaRef.current;
    if (!textarea) {
      const cur = value ?? "";
      onChange(cur ? `${cur} ${wrap}text${wrap}` : `${wrap}text${wrap}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const curText = value ?? "";
    if (start !== end) {
      const selectedText = curText.slice(start, end);
      const newText = curText.slice(0, start) + `${wrap}${selectedText}${wrap}` + curText.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + wrap.length, end + wrap.length);
      }, 0);
    } else {
      onChange(curText ? `${curText} ${wrap}text${wrap}` : `${wrap}text${wrap}`);
    }
  }

  return (
    <div className="space-y-sm text-left border border-border/70 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <UILabel htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </UILabel>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-md">
            <button
              type="button"
              title="Bold"
              onClick={() => { applyFormatting("**"); setIsBold(!isBold); }}
              className={`p-1 rounded transition-colors ${
                isBold ? "bg-background text-primary shadow-xs" : "hover:bg-background text-foreground hover:text-primary"
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic"
              onClick={() => { applyFormatting("*"); setIsItalic(!isItalic); }}
              className={`p-1 rounded transition-colors ${
                isItalic ? "bg-background text-primary shadow-xs" : "hover:bg-background text-foreground hover:text-primary"
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            {(
              [
                { align: "left" as const, Icon: AlignLeft },
                { align: "center" as const, Icon: AlignCenter },
                { align: "right" as const, Icon: AlignRight },
              ]
            ).map(({ align, Icon }) => (
              <button
                key={align}
                type="button"
                title={`Align ${align}`}
                onClick={() => setTextAlign(align)}
                className={`p-1 rounded transition-colors ${
                  textAlign === align ? "bg-background text-primary shadow-xs" : "text-foreground hover:bg-background"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <UITextarea
        ref={textareaRef}
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ textAlign, direction: "ltr" }}
        className="min-h-[100px] w-full text-base"
      />
    </div>
  );
}
