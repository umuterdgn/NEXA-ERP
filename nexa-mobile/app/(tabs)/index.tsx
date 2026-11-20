import React from "react";
import { UnauthorizedGuard } from "../../src/components/ui/NexaUI";
import DashboardScreen from "../../src/screens/DashboardScreen";

export default function HomeTabScreen() {
  return (
    <UnauthorizedGuard requiredModules={[]}>
      <DashboardScreen showHeader />
    </UnauthorizedGuard>
  );
}
