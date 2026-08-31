import { Plus } from "lucide-react";
import type { AddressDto } from "@/types/auth";
import { AddressCard } from "@/components/features/profile/AddressCard";
import { Button } from "@/components/ui/button";

interface ProfileAddressesTabProps {
  addresses: AddressDto[];
  onAddNew: () => void;
  onEdit: (address: AddressDto) => void;
  onDelete: (id: string) => void;
}

export function ProfileAddressesTab({
  addresses,
  onAddNew,
  onEdit,
  onDelete,
}: ProfileAddressesTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
        <h2 className="text-xl font-bold text-gray-900">Your Addresses</h2>
        <Button
          onClick={onAddNew}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl p-8">
          <p className="text-gray-500">No saved addresses yet.</p>
          <button
            onClick={onAddNew}
            className="mt-4 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
