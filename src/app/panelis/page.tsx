import { redirect } from "next/navigation";

// Agrākais panelis: progress tagad ir sākumlapā (Mācību kurss), konta iestatījumi — /konts.
export default function DashboardRedirect() {
  redirect("/");
}
