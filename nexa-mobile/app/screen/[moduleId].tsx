import React from "react";
import { useLocalSearchParams } from "expo-router";
import type { NativeScreenId } from "../../src/config/navigationConfig";
import { ScreenResolver } from "../../src/components/navigation/ScreenResolver";

export default function DynamicModuleRouteScreen() {
  const { moduleId, tab } = useLocalSearchParams<{
    moduleId?: string;
    tab?: string;
  }>();

  return (
    <ScreenResolver
      screenId={(moduleId || "dashboard") as NativeScreenId}
      initialTab={typeof tab === "string" ? tab : undefined}
    />
  );
}

