import React from "react";
import { UnauthorizedGuard } from "../src/components/ui/NexaUI";
import ProfileScreen from "../src/screens/ProfileScreen";

export default function ProfileRouteScreen() {
  return (
    <UnauthorizedGuard requiredModules={[]}>
      <ProfileScreen />
    </UnauthorizedGuard>
  );
}

