import Link from "next/link";
import { auth } from "@/auth";
import { getAccessibleSystems } from "@/lib/getAccessibleSystems";

export async function HeaderTabs() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const systems = await getAccessibleSystems(session.systems ?? []);

  return (
    <header style={{ display: "flex", gap: 16, padding: "12px 24px", borderBottom: "1px solid #ddd" }}>
      {systems.map((system) => (
        <Link
          key={system.code}
          href={system.url}
          style={{ fontWeight: system.code === "OOS" ? "bold" : "normal" }}
        >
          {system.code}
        </Link>
      ))}
    </header>
  );
}