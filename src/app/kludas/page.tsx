import { redirect } from "next/navigation";

// Agrākā “Kļūdu labošana” tagad ir daļa no “Trenēties”
export default async function ReviewRedirect({ searchParams }: { searchParams: Promise<{ visas?: string }> }) {
  const sp = await searchParams;
  redirect(sp.visas === "1" ? "/trenins" : "/trenins/sakt?atkartot=1");
}
