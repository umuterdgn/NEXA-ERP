/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import { SessionProvider } from "next-auth/react";

export default function NextAuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
