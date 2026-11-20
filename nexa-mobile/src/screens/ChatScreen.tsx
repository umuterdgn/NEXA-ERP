/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Saha Kanal Mesajlaşması & Fotoğraflı İletişim (GET/POST /api/mobile/chat)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { captureAndResolvePhotoUrl } from "../services/mediaHelper";
import {
  AppHeader,
  EmptyState,
  ScreenHeader,
  SkeletonList,
} from "../components/ui/NexaUI";
import { iosColors } from "../theme/iosTheme";
import type { ChatMessageItem } from "../types/api";

const CHANNELS = ["Şantiye Genel", "Proje Ekibi", "İSG & Acil"];

export default function ChatScreen({
  embeddedInTab = false,
}: {
  embeddedInTab?: boolean;
}) {
  const { activeProject } = useAuth();
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await mobileApi.chat.list({
          projectId: activeProject?.id,
          channelName: channel,
        });
        setMessages(res.messages || []);
      } catch (err: any) {
        if (!silent) {
          Alert.alert("Mesajlar Alınamadı", extractErrorMessage(err));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeProject?.id, channel]
  );

  useEffect(() => {
    loadMessages(false);
    const interval = setInterval(() => {
      loadMessages(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async (photoUrl?: string) => {
    const content = draft.trim();
    if (!content && !photoUrl) return;
    setSending(true);
    try {
      await mobileApi.chat.send({
        content: content || undefined,
        photoUrl,
        channelName: channel,
        projectId: activeProject?.id,
      });
      setDraft("");
      await loadMessages(true);
    } catch (err: any) {
      Alert.alert("Mesaj Gönderilemedi", extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleSendPhoto = async () => {
    const res = await captureAndResolvePhotoUrl({
      source: "camera",
      sourceModule: "FIELD_CHAT",
      projectId: activeProject?.id,
    });
    if (res?.photoUrl) {
      await handleSend(res.photoUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {embeddedInTab ? (
        <AppHeader title="Saha İletişim Kanalları" />
      ) : (
        <ScreenHeader
          title="Saha Mesajlaşma"
          subtitle={activeProject?.name || "Canlı Proje Kanalları"}
        />
      )}

      <View style={styles.channelBar}>
        {CHANNELS.map((ch) => {
          const active = channel === ch;
          return (
            <TouchableOpacity
              key={ch}
              style={[styles.channelPill, active && styles.channelPillActive]}
              onPress={() => setChannel(ch)}
            >
              <Text
                style={[
                  styles.channelText,
                  active && styles.channelTextActive,
                ]}
              >
                {ch}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMessages(true);
              }}
              tintColor="#0A7AFF"
            />
          }
        >
          {loading ? (
            <SkeletonList count={4} />
          ) : messages.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title={`${channel} Kanalı Sessiz`}
              subtitle="İlk saha mesajını veya fotoğraflı durumu aşağıdan gönderebilirsiniz."
            />
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubbleWrap,
                  msg.isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  {!msg.isMe && (
                    <Text style={styles.senderName}>
                      {msg.sender?.name || "Personel"} • {msg.sender?.role || ""}
                    </Text>
                  )}
                  {(msg.photoUrl || msg.attachmentUrl) ? (
                    <Image
                      source={{ uri: (msg.photoUrl || msg.attachmentUrl)! }}
                      style={styles.chatPhoto}
                      resizeMode="cover"
                    />
                  ) : null}
                  {msg.content ? (
                    <Text style={styles.msgText}>{msg.content}</Text>
                  ) : null}
                  <Text style={styles.msgTime}>
                    {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleSendPhoto}
            disabled={sending}
          >
            <Ionicons name="camera-outline" size={22} color="#3B9EFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={`${channel} kanalına yaz...`}
            placeholderTextColor="#6E6E73"
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!draft.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={() => handleSend()}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: iosColors.background },
  channelBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  channelPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  channelPillActive: {
    backgroundColor: "rgba(10,122,255,0.2)",
    borderColor: "#0A7AFF",
  },
  channelText: { color: "#8E8E93", fontSize: 11, fontWeight: "700" },
  channelTextActive: { color: "#FFFFFF" },
  scroll: { padding: 16, paddingBottom: 24, gap: 10 },
  bubbleWrap: { flexDirection: "row", width: "100%" },
  bubbleRight: { justifyContent: "flex-end" },
  bubbleLeft: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  bubbleMe: {
    backgroundColor: "#0A7AFF",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 4,
  },
  senderName: { color: "#3B9EFF", fontSize: 11, fontWeight: "700" },
  chatPhoto: { width: 200, height: 140, borderRadius: 10 },
  msgText: { color: "#FFFFFF", fontSize: 14, lineHeight: 19 },
  msgTime: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    alignSelf: "flex-end",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(10,122,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0A7AFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
