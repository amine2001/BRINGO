import { redirect } from "next/navigation";

export default async function NotificationSettingsRedirectPage() {
  redirect("/dashboard/workflow");
}
