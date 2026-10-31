/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Portal Entry & Redirection
 */

import { redirect } from "next/navigation";

export default function InspectionRootPage() {
  redirect("/inspection/dashboard");
}