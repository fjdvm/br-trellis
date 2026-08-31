"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData, type AddressFormData } from "@/lib/validators/auth";
import type { AddressDto, UserDto } from "@/types/auth";
import { userApi } from "@/lib/api/api-client";

export type TabType = "personal" | "addresses" | "orders";

export function useProfilePage() {
  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [user, setUser] = useState<UserDto | null>(null);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Address Modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  const resetForm = profileForm.reset;

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function fetchData() {
      try {
        setIsLoadingUser(true);
        const [meData, addrData] = await Promise.all([
          userApi.getMe(token),
          userApi.getAddresses(token),
        ]);
        if (isMounted) {
          setUser(meData);
          setAddresses(addrData);
          resetForm({
            fullName: meData.fullName,
            phoneNumber: meData.phoneNumber || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [token, resetForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileSuccessMessage(null);
    setProfileErrorMessage(null);
    try {
      const updated = await userApi.updateMe(data, token);
      setUser(updated);
      setProfileSuccessMessage("Profile updated successfully!");
    } catch (err) {
      setProfileErrorMessage(err instanceof Error ? err.message : "Failed to update profile.");
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address: AddressDto) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    try {
      setIsSavingAddress(true);
      if (editingAddress) {
        const updated = await userApi.updateAddress(editingAddress.id, data, token);
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await userApi.addAddress(data, token);
        setAddresses((prev) => [...prev, created]);
      }

      // Refresh address list to ensure defaults are correctly rendered
      const refreshed = await userApi.getAddresses(token);
      setAddresses(refreshed);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await userApi.deleteAddress(id, token);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete address.");
    }
  };

  return {
    activeTab,
    setActiveTab,
    user,
    addresses,
    isLoadingUser,
    isAddressModalOpen,
    setIsAddressModalOpen,
    editingAddress,
    isSavingAddress,
    profileForm,
    profileSuccessMessage,
    profileErrorMessage,
    onProfileSubmit,
    handleOpenAddAddress,
    handleEditAddress,
    handleSaveAddress,
    handleDeleteAddress,
  };
}
