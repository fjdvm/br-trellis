import type { AddressDto } from "@/types/auth";
import { MapPin, Pencil, Trash2 } from "lucide-react";

interface AddressCardProps {
  address: AddressDto;
  onEdit: (address: AddressDto) => void;
  onDelete: (id: string) => void;
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <div
      className={`p-6 rounded-xl border transition-colors flex justify-between items-start ${
        address.isDefault
          ? "border-[var(--primary)]/30 bg-[var(--primary-fixed)]/10"
          : "border-[var(--border)] hover:border-[var(--primary)]/40"
      }`}
    >
      <div className="flex gap-4">
        <MapPin className="text-[var(--primary)] w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-[var(--primary)] text-sm">{address.label}</p>
            {address.isDefault && (
              <span className="text-[10px] bg-[var(--primary)] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--muted)] mt-1">{address.street}</p>
          <p className="text-sm text-[var(--muted)]">
            {address.city}, {address.province} {address.postalCode}
          </p>
          <p className="text-sm text-[var(--muted)]">{address.country}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(address)}
          className="p-2 rounded-lg text-gray-500 hover:text-[var(--primary)] hover:bg-gray-100 transition-colors cursor-pointer text-sm flex items-center gap-1.5"
          title="Edit address"
        >
          <Pencil className="w-4 h-4" /> Edit
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="p-2 rounded-lg text-[var(--error)] hover:bg-[var(--error-container)]/30 transition-colors cursor-pointer text-sm flex items-center gap-1.5"
          title="Delete address"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
}
