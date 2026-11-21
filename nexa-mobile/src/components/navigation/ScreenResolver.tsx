/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Dinamik Native Ekran Çözücü & RBAC Rota Koruması
 * Tüm NativeScreenId rotalarını yetki kontrolüyle ilgili canlı ekrana bağlar.
 */

import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  isNativeScreenAuthorized,
  type NativeScreenId,
} from "../../config/navigationConfig";
import { UnauthorizedGuard } from "../ui/NexaUI";
import DashboardScreen from "../../screens/DashboardScreen";
import TasksScreen from "../../screens/TasksScreen";
import JournalScreen from "../../screens/JournalScreen";
import WorkProofsScreen from "../../screens/WorkProofsScreen";
import InspectionsScreen from "../../screens/InspectionsScreen";
import SamplesScreen from "../../screens/SamplesScreen";
import DeficienciesScreen from "../../screens/DeficienciesScreen";
import DynamicFormsScreen from "../../screens/DynamicFormsScreen";
import AttendanceScreen from "../../screens/AttendanceScreen";
import HrRequestsScreen from "../../screens/HrRequestsScreen";
import HrSelfScreen from "../../screens/HrSelfScreen";
import LogisticsScreen from "../../screens/LogisticsScreen";
import RoutesScreen from "../../screens/RoutesScreen";
import SafetyScreen from "../../screens/SafetyScreen";
import BleRadarScreen from "../../screens/BleRadarScreen";
import AiVisionScreen from "../../screens/AiVisionScreen";
import ChatScreen from "../../screens/ChatScreen";
import type { ModuleKey } from "../../types/api";

const SCREEN_REQUIRED_MODULES: Record<NativeScreenId, ModuleKey[]> = {
  dashboard: [],
  tasks: ["tasks_work_orders"],
  journal: ["site_journal"],
  work_proofs: ["work_proofs"],
  inspections: ["inspections", "reinforcement_check", "concrete_pouring_qa"],
  samples: ["samples_core", "concrete_pouring_qa"],
  deficiencies: ["deficiencies", "ncr_dof"],
  forms: ["dynamic_forms", "form_builder"],
  attendance: ["my_attendance_qr", "attendance"],
  hr_requests: ["my_leaves", "my_salary_advances", "my_expenses", "approvals"],
  hr_self: ["my_profile", "my_assigned_equipments"],
  logistics: [
    "gate_security",
    "goods_receiving",
    "logistics_appointments",
    "driver_deliveries",
  ],
  logistics_qr: ["qr_micro_consumption", "warehouse_inventory", "material_requests"],
  routes: ["route_optimization", "driver_deliveries"],
  isg: ["near_miss", "sos_alarm", "isg_dashboard"],
  ble_radar: ["ble_radar"],
  ai_vision: ["ai_vision", "site_camera"],
  chat: ["internal_comms", "ptt_chat"],
};

export function ScreenResolver({
  screenId,
  initialTab,
  embeddedInTab = false,
}: {
  screenId: NativeScreenId;
  initialTab?: string;
  embeddedInTab?: boolean;
}) {
  const { role, allowedModules } = useAuth();
  const required = SCREEN_REQUIRED_MODULES[screenId];

  // Geçersiz screenId veya sunucudan gelen yetki matrisinde izin yoksa guard devreye girer
  if (!required || !isNativeScreenAuthorized(screenId, role, allowedModules)) {
    return (
      <UnauthorizedGuard requiredModules={required || ["sys_admin"]}>
        <></>
      </UnauthorizedGuard>
    );
  }

  const renderScreen = () => {
    switch (screenId) {
      case "dashboard":
        return <DashboardScreen />;
      case "tasks":
        return <TasksScreen embeddedInTab={embeddedInTab} />;
      case "journal":
        return <JournalScreen embeddedInTab={embeddedInTab} />;
      case "work_proofs":
        return <WorkProofsScreen embeddedInTab={embeddedInTab} />;
      case "inspections":
        return <InspectionsScreen embeddedInTab={embeddedInTab} />;
      case "samples":
        return <SamplesScreen embeddedInTab={embeddedInTab} />;
      case "deficiencies":
        return <DeficienciesScreen embeddedInTab={embeddedInTab} />;
      case "forms":
        return <DynamicFormsScreen />;
      case "attendance":
        return <AttendanceScreen embeddedInTab={embeddedInTab} />;
      case "hr_requests":
        return <HrRequestsScreen embeddedInTab={embeddedInTab} />;
      case "hr_self":
        return <HrSelfScreen embeddedInTab={embeddedInTab} />;
      case "logistics":
        return (
          <LogisticsScreen
            embeddedInTab={embeddedInTab}
            initialTab={
              initialTab === "qr" || initialTab === "requests" ? initialTab : "gate"
            }
          />
        );
      case "logistics_qr":
        return <LogisticsScreen embeddedInTab={embeddedInTab} initialTab="qr" />;
      case "routes":
        return <RoutesScreen embeddedInTab={embeddedInTab} />;
      case "isg":
        return (
          <SafetyScreen
            embeddedInTab={embeddedInTab}
            initialTab={initialTab === "sos" ? "sos" : "near_miss"}
          />
        );
      case "ble_radar":
        return <BleRadarScreen embeddedInTab={embeddedInTab} />;
      case "ai_vision":
        return <AiVisionScreen />;
      case "chat":
        return <ChatScreen embeddedInTab={embeddedInTab} />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <UnauthorizedGuard requiredModules={required}>
      {renderScreen()}
    </UnauthorizedGuard>
  );
}
