import React, { useMemo } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { getDynamicTabs } from "../../src/config/navigationConfig";
import { ScreenResolver } from "../../src/components/navigation/ScreenResolver";

export default function PrimaryDynamicTabScreen() {
  const { role, tenantType, allowedModules } = useAuth();
  const { slot2 } = useMemo(
    () => getDynamicTabs(role, tenantType, allowedModules),
    [role, tenantType, allowedModules]
  );

  return <ScreenResolver screenId={slot2.screenId} embeddedInTab />;
}

