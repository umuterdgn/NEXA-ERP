import React from "react";
import { UnauthorizedGuard } from "../src/components/ui/NexaUI";
import QrIdCardScreen from "../src/screens/QrIdCardScreen";

export default function QrIdRouteScreen() {
  return (
    <UnauthorizedGuard requiredModules={[]}>
      <QrIdCardScreen />
    </UnauthorizedGuard>
  );
}

