/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { redirect } from "next/navigation";

export default function BIMPage() {
  // Redirect to projects page where BIM viewers are available
  redirect("/admin/projects");
}
