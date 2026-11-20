import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { UnauthorizedGuard } from "../src/components/ui/NexaUI";
import SsoWebViewScreen from "../src/screens/SsoWebViewScreen";
import type { ModuleKey } from "../src/types/api";

function resolveSsoRequiredModules(targetRoute?: string): ModuleKey[] {
  const path = String(targetRoute || "").toLowerCase();
  if (path.includes("/bim") || path.includes("/ar/")) return ["bim_3d"];
  if (path.includes("/blueprints")) return ["digital_drawings", "revisions"];
  if (path.includes("/drone")) return ["drone_maps"];
  if (path.includes("/map") || path.includes("/rollout-map")) return ["site_map"];
  if (path.includes("/boq")) return ["boq", "progress_payments"];
  if (path.includes("/finance")) return ["finance_cash"];
  if (path.includes("/projects") || path.includes("/branch")) return ["projects"];
  return [];
}

export default function SsoRouteScreen() {
  const { targetRoute, title, projectId } = useLocalSearchParams<{
    targetRoute?: string;
    title?: string;
    projectId?: string;
  }>();

  const routeStr = typeof targetRoute === "string" ? targetRoute : undefined;
  const titleStr = typeof title === "string" ? title : "Nexa Web Modülü";
  const projectStr = typeof projectId === "string" ? projectId : undefined;

  const requiredModules = useMemo(
    () => resolveSsoRequiredModules(routeStr),
    [routeStr]
  );

  return (
    <UnauthorizedGuard requiredModules={requiredModules}>
      <SsoWebViewScreen
        title={titleStr}
        targetRoute={routeStr}
        projectId={projectStr}
      />
    </UnauthorizedGuard>
  );
}

