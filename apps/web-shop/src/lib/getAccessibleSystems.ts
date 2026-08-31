export type SystemInfo = {
  code: string;
  name: string;
  url: string;
  icon: string;
};

const CATALOG_URL = `${process.env.AUTH_ISSUER}api/systems`;

export async function getAccessibleSystems(
  userSystemCodes: string[],
): Promise<SystemInfo[]> {
  if (userSystemCodes.length === 0) {
    return [];
  }

  const res = await fetch(CATALOG_URL, { cache: "no-store" });

  if (!res.ok) {
    console.error(`Failed to fetch systems catalog: ${res.status}`);
    return [];
  }

  const catalog: SystemInfo[] = await res.json();

  return catalog.filter((system) => userSystemCodes.includes(system.code));
}
