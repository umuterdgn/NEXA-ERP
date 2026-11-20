import React from "react";
import { UnauthorizedGuard } from "../src/components/ui/NexaUI";
import SyncQueueScreen from "../src/screens/SyncQueueScreen";

export default function SyncQueueRouteScreen() {
  return (
    <UnauthorizedGuard requiredModules={[]}>
      <SyncQueueScreen />
    </UnauthorizedGuard>
  );
}

