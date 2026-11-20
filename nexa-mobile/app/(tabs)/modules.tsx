import React from "react";
import { UnauthorizedGuard } from "../../src/components/ui/NexaUI";
import ModulesCatalogScreen from "../../src/screens/ModulesCatalogScreen";

export default function ModulesTabScreen() {
  return (
    <UnauthorizedGuard requiredModules={[]}>
      <ModulesCatalogScreen />
    </UnauthorizedGuard>
  );
}
