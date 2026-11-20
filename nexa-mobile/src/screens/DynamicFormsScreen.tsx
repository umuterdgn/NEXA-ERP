/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Dinamik Denetim Formları Şablon & Yanıt Ekranı (GET/POST /api/mobile/forms)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, mobileApi } from "../services/apiClient";
import {
  EmptyState,
  GlassCard,
  ScreenHeader,
  SkeletonList,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { DynamicFormTemplate } from "../types/api";

export default function DynamicFormsScreen() {
  const { activeProject } = useAuth();
  const [forms, setForms] = useState<DynamicFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeForm, setActiveForm] = useState<DynamicFormTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadForms = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await mobileApi.forms.list();
      setForms(res.forms || []);
    } catch (err: any) {
      Alert.alert("Formlar Alınamadı", extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadForms(false);
  }, [loadForms]);

  const openForm = (form: DynamicFormTemplate) => {
    const initial: Record<string, string | number | boolean> = {};
    const fields = Array.isArray(form.fields) ? form.fields : [];
    fields.forEach((f, idx) => {
      const key = f.id || f.name || f.key || `q_${idx}`;
      if (f.type === "boolean" || f.type === "checkbox") {
        initial[key] = true;
      } else {
        initial[key] = "";
      }
    });
    setAnswers(initial);
    setNotes("");
    setActiveForm(form);
  };

  const handleSubmit = async () => {
    if (!activeForm) return;
    try {
      setSubmitting(true);
      const res = await mobileApi.forms.submit({
        formId: activeForm.id,
        projectId: activeProject?.id,
        answers,
        notes: notes.trim() || undefined,
      });
      setActiveForm(null);
      Alert.alert("Gönderildi", res.message || "Denetim formu kaydedildi.");
    } catch (err: any) {
      Alert.alert("Hata", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Dinamik Denetim Formları"
        subtitle={activeProject?.name || "Kontrol Listesi Şablonları"}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadForms(true)}
            tintColor={iosColors.systemBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonList count={3} />
        ) : forms.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Dinamik Form Şablonu Yok"
            subtitle="Kiracınız için web panelinden denetim formu tanımlandığında burada listelenir."
            actionLabel="Yenile"
            onAction={() => loadForms(true)}
          />
        ) : (
          forms.map((f) => (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.82}
              onPress={() => openForm(f)}
            >
              <GlassCard style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.catBadge}>{f.category || "DENETİM"}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                </View>
                <Text style={styles.formTitle}>{f.title}</Text>
                {f.description ? (
                  <Text style={styles.formDesc}>{f.description}</Text>
                ) : null}
                <Text style={styles.fieldCount}>
                  {Array.isArray(f.fields) ? f.fields.length : 0} Soru Alanı
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={Boolean(activeForm)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveForm(null)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {activeForm?.title}
              </Text>
              <TouchableOpacity onPress={() => setActiveForm(null)}>
                <Ionicons name="close" size={22} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {Array.isArray(activeForm?.fields) &&
              activeForm.fields.map((field, idx) => {
                const key = field.id || field.name || field.key || `q_${idx}`;
                const val = answers[key];

                return (
                  <View key={key} style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {idx + 1}. {field.label}
                      {field.required ? " *" : ""}
                    </Text>

                    {field.type === "boolean" || field.type === "checkbox" ? (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.boolBtn,
                            val === true && styles.boolBtnYes,
                          ]}
                          onPress={() =>
                            setAnswers((prev) => ({ ...prev, [key]: true }))
                          }
                        >
                          <Text style={styles.boolBtnText}>Evet / Uygun</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.boolBtn,
                            val === false && styles.boolBtnNo,
                          ]}
                          onPress={() =>
                            setAnswers((prev) => ({ ...prev, [key]: false }))
                          }
                        >
                          <Text style={styles.boolBtnText}>Hayır / Uygunsuz</Text>
                        </TouchableOpacity>
                      </View>
                    ) : field.type === "select" && Array.isArray(field.options) ? (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {field.options.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.optChip,
                              val === opt && styles.optChipActive,
                            ]}
                            onPress={() =>
                              setAnswers((prev) => ({ ...prev, [key]: opt }))
                            }
                          >
                            <Text style={styles.boolBtnText}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <TextInput
                        style={styles.input}
                        value={String(val ?? "")}
                        onChangeText={(txt) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [key]: field.type === "number" ? Number(txt) || txt : txt,
                          }))
                        }
                        keyboardType={field.type === "number" ? "numeric" : "default"}
                        placeholder="Yanıtınızı yazınız..."
                        placeholderTextColor="#636366"
                      />
                    )}
                  </View>
                );
              })}

            <Text style={styles.fieldLabel}>Genel Denetim Notu</Text>
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Varsa ek saha notu..."
              placeholderTextColor="#636366"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Form Yanıtını Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  scrollContent: { padding: 16, paddingBottom: 110, gap: 12 },
  card: { gap: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  catBadge: { fontSize: 10, fontWeight: "800", color: "#58A6FF", letterSpacing: 0.4 },
  formTitle: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  formDesc: { fontSize: 12, color: iosColors.labelMuted },
  fieldCount: { fontSize: 11, color: "#34C759", fontWeight: "700", marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#E5E7EB" },
  boolBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  boolBtnYes: { backgroundColor: "rgba(52,199,89,0.22)", borderColor: "#34C759" },
  boolBtnNo: { backgroundColor: "rgba(255,59,48,0.22)", borderColor: "#FF453A" },
  boolBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  optChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  optChipActive: { borderColor: iosColors.systemBlue, backgroundColor: "rgba(10,122,255,0.2)" },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 11,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: iosColors.systemBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});

