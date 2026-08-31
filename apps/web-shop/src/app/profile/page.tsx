import { ProfilePage } from "@/components/features/profile/ProfilePage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile & Account Settings | Bren Raphael's Ube Jam & Halaya",
  description: "Manage your profile, addresses, and view your order history",
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
