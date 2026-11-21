import { redirect } from "next/navigation";

// Agrākā “Kļūdu labošana” tagad ir daļa no “Trenēties”
export default function ReviewRedirect() {
  redirect("/trenins/sakt?kludas=1");
}
