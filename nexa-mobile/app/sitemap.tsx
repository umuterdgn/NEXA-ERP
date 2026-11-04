import React from "react";
import { useRouter } from "expo-router";
import SiteMapScreen from "../src/screens/SuperAdmin/SiteMapScreen";

export default function SiteMapRoute() {
  const router = useRouter();

  return <SiteMapScreen onBackPress={() => router.back()} />;
}
