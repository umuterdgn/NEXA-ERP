/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Tenant SaaS Feature Toggles & Module Permissions Checker
 */

export function isMenuItemAllowed(
  item: { href: string; label: string; category: string },
  enabledModules: string[] | null | undefined,
  userRole?: string
): boolean {
  if (userRole === "SUPER_ADMIN") return true
  if (!enabledModules || enabledModules.length === 0) return true

  const href = item.href.toLowerCase()
  const cat = item.category.toUpperCase()
  const label = item.label.toLowerCase()

  // 1. 3D BIM & Modeller
  if (href.includes("/bim") || label.includes("bim") || label.includes("3d model")) {
    return enabledModules.includes("BIM") || enabledModules.includes("BIM_VIEWER")
  }

  // 2. OCR Evrak Denetimi
  if (href.includes("/smart-documents") || href.includes("/ocr") || label.includes("ocr")) {
    return enabledModules.includes("OCR") || enabledModules.includes("AI_VISION") || enabledModules.includes("DOCUMENTS")
  }

  // 3. AI Görsel Analiz
  if (href.includes("/ai-vision") || label.includes("ai görsel")) {
    return enabledModules.includes("AI_VISION")
  }

  // 4. Keşif & Metraj (BoQ)
  if (
    href.includes("/boq") ||
    href.includes("/progress-payments") ||
    label.includes("metraj") ||
    label.includes("keşif")
  ) {
    return enabledModules.includes("BOQ_METRAJ") || enabledModules.includes("PROJECTS")
  }

  // 5. İHA & Drone Harita
  if (
    href.includes("/drone") ||
    href.includes("/drone-maps") ||
    label.includes("drone") ||
    label.includes("i̇ha") ||
    label.includes("hava & drone")
  ) {
    return enabledModules.includes("DRONE")
  }

  // 6. Kasa, Finans & Tedarik
  if (
    cat.includes("FİNANS") ||
    href.includes("/finance") ||
    href.includes("/billing") ||
    label.includes("kasa") ||
    label.includes("çek / senet")
  ) {
    return enabledModules.includes("FINANCE")
  }

  // 7. Merkezi Evrak Arşivi
  if (
    href.includes("/archive") ||
    href.includes("/documents") ||
    label.includes("dijital evrak") ||
    label.includes("ruhsat & evrak") ||
    label.includes("arşiv")
  ) {
    return enabledModules.includes("DOCUMENTS")
  }

  // 8. Personel & Puantaj
  if (
    cat.includes("İNSAN KAYNAKLARI") ||
    cat.includes("PERSONEL") ||
    href.includes("/personel") ||
    href.includes("/personnel") ||
    href.includes("/attendance")
  ) {
    return enabledModules.includes("HR") || enabledModules.includes("PERSONNEL")
  }

  // 8. Kalite Güvence (QA/QC)
  if (
    cat.includes("KALİTE") ||
    href.includes("/qa-qc") ||
    href.includes("/materials") ||
    href.includes("/ncr")
  ) {
    return enabledModules.includes("QA_QC")
  }

  // 9. İSG & Risk Planları
  if (cat.includes("İSG") || href.includes("/isg")) {
    return enabledModules.includes("ISG")
  }

  // 10. Projeler & CRM
  if (href.includes("/projects") || href.includes("/crm")) {
    return enabledModules.includes("PROJECTS")
  }

  // 11. Saha Denetim & Formlar
  if (
    cat.includes("YAPI DENETİM") ||
    href.includes("/forms") ||
    href.includes("/samples") ||
    href.includes("/reinforcement") ||
    href.includes("/attachment") ||
    href.includes("/inspections") ||
    href.includes("/deficiencies")
  ) {
    return enabledModules.includes("INSPECTION")
  }

  return true
}
