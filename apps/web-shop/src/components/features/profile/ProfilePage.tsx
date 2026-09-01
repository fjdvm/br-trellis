"use client";

import { useProfilePage } from "@/hooks/useProfilePage";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfilePersonalTab } from "./ProfilePersonalTab";
import { ProfileAddressesTab } from "./ProfileAddressesTab";
import { ProfileOrdersTab } from "./ProfileOrdersTab";
import { AddressModal } from "@/components/features/profile/AddressModal";

export function ProfilePage() {
  const {
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
  } = useProfilePage();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-8 animate-fade-in bg-surface">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/30 pb-6">
        <span className="label-upper text-secondary block">Account Dashboard</span>
        <h1 className="headline-xl font-serif text-primary">Account Settings</h1>
        <p className="body-md text-on-surface-variant max-w-xl">
          Manage your personal details, saved shipping addresses, and order history.
        </p>
      </div>

      {/* Profile Layout: Side Tabs + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        </aside>

        <main className="lg:col-span-9 bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-10 shadow-xs">
          {isLoadingUser ? (
            <div className="p-12 text-center font-sans text-xs text-on-surface-variant">
              Loading account information...
            </div>
          ) : (
            <>
              {activeTab === "personal" && (
                <ProfilePersonalTab
                  user={user}
                  form={profileForm}
                  onSubmit={onProfileSubmit}
                  successMessage={profileSuccessMessage}
                  errorMessage={profileErrorMessage}
                />
              )}

              {activeTab === "addresses" && (
                <ProfileAddressesTab
                  addresses={addresses}
                  onAddNew={handleOpenAddAddress}
                  onEdit={handleEditAddress}
                  onDelete={handleDeleteAddress}
                />
              )}

              {activeTab === "orders" && <ProfileOrdersTab />}
            </>
          )}
        </main>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSubmit={handleSaveAddress}
        initialData={editingAddress}
        isLoading={isSavingAddress}
      />
    </div>
  );
}
