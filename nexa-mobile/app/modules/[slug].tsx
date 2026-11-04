/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa Mobile - Universal Module Fallback & Placeholder Screen
 */

import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import PlaceholderScreen from "../../src/components/common/PlaceholderScreen";
import { ALL_MODULES } from "../../src/screens/ModulesScreen";

export default function GenericModuleScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // Eşleşen modülü bul
  const matched = ALL_MODULES.find((m) => m.slug === slug);

  const moduleData = matched || {
    id: "unknown",
    slug: slug || "module",
    title: slug
      ? slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Şantiye Modülü",
    category: "FIELD_PRODUCTION" as const,
    icon: "layers" as const,
    color: "#0A7AFF",
    description: "Saha operasyonu ve dijital yönetim modülü",
    route: `/modules/${slug}`,
  };

  return (
    <PlaceholderScreen
      slug={moduleData.slug}
      title={moduleData.title}
      category={moduleData.category}
      icon={moduleData.icon}
      color={moduleData.color}
      description={moduleData.description}
      onBack={() => router.back()}
    />
  );
}
