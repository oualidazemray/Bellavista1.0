// src/app/client/page.tsx
import { redirect } from "next/navigation";

export default function ClientRootPage() {
  // Redirect to the default dashboard page
  redirect("/client/dashboard");
}
