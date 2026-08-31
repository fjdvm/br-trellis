"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressFormData } from "@/lib/validators/auth";
import type { AddressDto } from "@/types/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  initialData?: AddressDto | null;
  isLoading?: boolean;
}

export function AddressModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: AddressModalProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Home",
      street: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Philippines",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        label: initialData.label,
        street: initialData.street,
        city: initialData.city,
        province: initialData.province,
        postalCode: initialData.postalCode,
        country: initialData.country,
        isDefault: initialData.isDefault,
      });
    } else {
      form.reset({
        label: "Home",
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "Philippines",
        isDefault: false,
      });
    }
  }, [initialData, form, isOpen]);

  const handleFormSubmit = async (data: AddressFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[var(--primary)]">
            {initialData ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input id="addr-label" type="text" placeholder="e.g. Home, Office" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input id="addr-street" type="text" placeholder="123 Purple Lane, Brgy. San Jose" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input id="addr-city" type="text" placeholder="Quezon City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province / State</FormLabel>
                    <FormControl>
                      <Input id="addr-province" type="text" placeholder="Metro Manila" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input id="addr-postal" type="text" placeholder="1100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input id="addr-country" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                  <FormControl>
                    <input
                      id="addr-default"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </FormControl>
                  <FormLabel htmlFor="addr-default" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Set as default shipping address
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-full px-6"
              >
                {isLoading ? "Saving..." : initialData ? "Save Changes" : "Add Address"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
