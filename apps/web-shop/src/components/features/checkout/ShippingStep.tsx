"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { userApi } from "@/lib/api/api-client";
import type { AddressDto } from "@/types/auth";
import type { ShippingAddressRequest } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus } from "lucide-react";

interface ShippingStepProps {
  initialAddress: ShippingAddressRequest | null;
  onNext: (address: ShippingAddressRequest) => void;
}

export function ShippingStep({ initialAddress, onNext }: ShippingStepProps) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  const [recipientName, setRecipientName] = useState(initialAddress?.recipientName || session?.user?.name || "");
  const [street, setStreet] = useState(initialAddress?.street || "");
  const [city, setCity] = useState(initialAddress?.city || "");
  const [province, setProvince] = useState(initialAddress?.province || "");
  const [postalCode, setPostalCode] = useState(initialAddress?.postalCode || "");
  const [phone, setPhone] = useState(initialAddress?.phone || "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      userApi.getAddresses(token).then((res) => {
        setSavedAddresses(res);
        const defaultAddr = res.find((a) => a.isDefault) || res[0];
        if (defaultAddr && !initialAddress) {
          setSelectedAddressId(defaultAddr.id);
          setRecipientName(session?.user?.name || "");
          setStreet(defaultAddr.street);
          setCity(defaultAddr.city);
          setProvince(defaultAddr.province);
          setPostalCode(defaultAddr.postalCode);
        }
      }).catch(() => {});
    }
  }, [token, session, initialAddress]);

  const handleSelectSaved = (addr: AddressDto) => {
    setSelectedAddressId(addr.id);
    setUseCustomAddress(false);
    setStreet(addr.street);
    setCity(addr.city);
    setProvince(addr.province);
    setPostalCode(addr.postalCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !street.trim() || !city.trim() || !province.trim() || !phone.trim()) {
      setFormError("Please fill out all required shipping fields.");
      return;
    }
    setFormError(null);
    onNext({
      recipientName,
      street,
      city,
      province,
      postalCode,
      phone,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2 border-b border-outline-variant/20 pb-3">
        <MapPin className="w-5 h-5 text-primary" />
        Shipping Address
      </h2>

      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <Label className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Saved Addresses
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id && !useCustomAddress;
              return (
                <div
                  key={addr.id}
                  onClick={() => handleSelectSaved(addr)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-outline-variant/30 hover:border-primary/40 bg-surface-container-lowest"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans font-bold text-xs text-on-surface uppercase">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-secondary-container text-on-secondary-container font-bold px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-on-surface font-medium truncate">{addr.street}</p>
                  <p className="font-sans text-xs text-on-surface-variant">
                    {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setUseCustomAddress(true);
              setSelectedAddressId(null);
            }}
            className="text-xs font-semibold gap-1.5 border-dashed border-outline-variant/50 hover:bg-surface-container"
          >
            <Plus className="w-4 h-4" />
            Enter Custom Address
          </Button>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-error-container/30 text-on-error-container text-xs font-medium border border-error-container">
          {formError}
        </div>
      )}

      <div className="space-y-4 pt-2 border-t border-outline-variant/30 font-sans">
        <div>
          <Label htmlFor="recipientName" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Recipient Full Name *
          </Label>
          <Input
            id="recipientName"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Bren Raphael"
            className="mt-1.5 px-5 py-3 bg-surface-container-lowest border-outline-variant/40 focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="street" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Street Address *
          </Label>
          <Input
            id="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="House/Unit #, Street name"
            className="mt-1.5 px-5 py-3 bg-surface-container-lowest border-outline-variant/40 focus:border-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              City / Municipality *
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Baguio City"
              className="mt-1.5 px-5 py-3 bg-surface-container-lowest border-outline-variant/40 focus:border-primary"
              required
            />
          </div>
          <div>
            <Label htmlFor="province" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Province *
            </Label>
            <Input
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="e.g. Benguet"
              className="mt-1.5 px-5 py-3 bg-surface-container-lowest border-outline-variant/40 focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Postal Code
            </Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 2600"
              className="mt-1.5 px-5 py-3 bg-surface-container-lowest border-outline-variant/40 focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Contact Phone Number *
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0917XXXXXXX"
              className="mt-1.5 px-5 py-3 bg-surface-container-lowest border-outline-variant/40 focus:border-primary"
              required
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" className="rounded-xl px-8 py-3 bg-primary text-white font-semibold hover:bg-primary-container shadow-sm">
          Continue to Order Review
        </Button>
      </div>
    </form>
  );
}
