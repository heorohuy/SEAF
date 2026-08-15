export async function getSicarisFleet() {
  const response = await fetch("/api/fleet");

  if (!response.ok) {
    throw new Error("Failed to fetch Sicaris fleet");
  }

  return response.json();
}
