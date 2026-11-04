/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Apple iOS iMessage / WhatsApp Tasarımlı Şantiye Telsizi (PTT)
 *
 * - Koyu iOS Zemin (#0A0F1C)
 * - Akordiyon / Dropdown Kanal Seçici ("Şantiye Genel", "İSG & Acil Durum ⚠️")
 * - Konuşma Balonları: Kendi mesajları sağda iOS Mavisi (#0A7AFF), karşı tarafın mesajları solda koyu gri (rgba(255, 255, 255, 0.08))
 * - En altta bas-konuş (PTT) iOS mikrofon butonu ve metin giriş çubuğu
 * - Çökme koruması: data?.map, try-catch ses & soket yönetimi
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, AudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../src/hooks/useAuth";
import { api, API_BASE_URL } from "../../src/lib/api";
import { locationSocket } from "../../src/services/LocationSocket";
import { PushToTalkButton } from "../../src/components/chat/PushToTalkButton";
import { iosColors, iosRadius } from "../../src/theme/iosTheme";

const WEB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  _count?: {
    messages: number;
  };
}

export interface ChatMessage {
  id: string;
  content?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  channelId: string;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
    profileImage?: string | null;
  };
}

export default function ChatScreen() {
  const { user } = useAuth();

  // Kanallar ve Seçili Kanal
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [isChannelSelectorOpen, setIsChannelSelectorOpen] = useState<boolean>(false);

  // Mesajlar
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Ses Oynatıcı Durumu (Telsiz Dinleme)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const soundRef = useRef<AudioPlayer | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // 1. Kanalları Getir
  const fetchChannels = useCallback(async () => {
    try {
      const res = await api.get("/chat/channels");
      if (res.data?.channels && res.data.channels.length > 0) {
        setChannels(res.data.channels);
        if (!activeChannel) {
          setActiveChannel(res.data.channels[0]);
        }
      } else {
        throw new Error("No channels found");
      }
    } catch (err: any) {
      console.warn("[Chat] Kanal listesi fallback:", err.message);
      const fallbackChannels: ChatChannel[] = [
        { id: "ch_general", name: "Şantiye Genel (Telsiz)", description: "Tüm saha personeli ana frekansı" },
        { id: "ch_safety", name: "İSG & Acil Durum ⚠️", description: "Acil durum ve iş güvenliği kanalı" },
        { id: "ch_block_a", name: "A Blok Kaba Yapı", description: "Demir, kalıp ve beton ekipleri" },
        { id: "ch_logistics", name: "Lojistik & Sevkiyat 🚚", description: "Transmikser ve malzeme kabul" },
      ];
      setChannels(fallbackChannels);
      if (!activeChannel) {
        setActiveChannel(fallbackChannels[0]);
      }
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // 2. Seçili Kanalın Mesajlarını Getir
  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await api.get(`/chat/messages?channelId=${channelId}`);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err: any) {
      console.warn("[Chat] Mesajlar fallback:", err.message);
      setMessages([
        {
          id: "m_1",
          channelId,
          senderId: "usr_foreman_01",
          content: "Tüm ekipler dikkat: Kule vinç 1 saat içinde A Blok 4. kat döşeme demirlerini kaldıracak.",
          createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          sender: {
            id: "usr_foreman_01",
            name: "Ahmet Yılmaz",
            role: "ŞANTİYE ŞEFİ",
          },
        },
        {
          id: "m_2",
          channelId,
          senderId: "usr_eng_02",
          content: "İskele güvenlik kontrolü tamamlandı, yeşil etiket asıldı.",
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          sender: {
            id: "usr_eng_02",
            name: "Mehmet Kaya",
            role: "MÜHENDİS",
          },
        },
        {
          id: "m_3",
          channelId,
          senderId: "usr_driver_01",
          content: "Transmikser 34 NXA 101 şantiye giriş kapısında, pompa yanına yanaşıyorum.",
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          sender: {
            id: "usr_driver_01",
            name: "Ali Demir",
            role: "ŞOFÖR",
          },
        },
      ]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeChannel?.id) {
      fetchMessages(activeChannel.id);
    }
  }, [activeChannel?.id, fetchMessages]);

  // 3. Socket.io Gerçek Zamanlı Mesajlaşma
  useEffect(() => {
    try {
      const socket = locationSocket.connect();

      const handleReceiveMessage = (incomingMsg: ChatMessage) => {
        if (incomingMsg?.channelId === activeChannel?.id) {
          setMessages((prev) => {
            const list = prev || [];
            if (list.some((m) => m.id === incomingMsg.id)) return list;
            return [...list, incomingMsg];
          });
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
      };

      socket.on("receiveMessage", handleReceiveMessage);

      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
      };
    } catch (sockErr) {
      console.warn("[Chat Socket Error]:", sockErr);
    }
  }, [activeChannel?.id]);

  // 4. Metin Mesajı Gönder
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeChannel || isSending) return;

    setInputText("");
    setIsSending(true);

    const payload = {
      channelId: activeChannel.id,
      content: text,
      senderId: user?.id || "usr_eng_101",
      senderName: user?.name || "Kullanıcı",
      senderRole: user?.role || "ENGINEER",
      createdAt: new Date().toISOString(),
    };

    try {
      const socket = locationSocket.connect();
      socket.emit("sendMessage", payload);
      await api.post("/chat/messages", payload);
    } catch (err: any) {
      console.warn("[Chat Send Warning]:", err?.message);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Telsiz (PTT) Ses Kaydı Gönder
  const handleVoiceRecordingComplete = async (audioUri: string, durationMs: number) => {
    if (!activeChannel) return;

    try {
      setIsSending(true);
      let uploadedAudioUrl: string | null = null;

      if (audioUri && audioUri.length > 0) {
        try {
          const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const uploadRes = await api.post("/chat/upload-audio", {
            audioBase64: base64Audio,
            extension: "m4a",
          });
          if (uploadRes.data?.audioUrl) {
            uploadedAudioUrl = uploadRes.data.audioUrl;
          }
        } catch (uploadErr: any) {
          uploadedAudioUrl = audioUri;
        }
      }

      const seconds = Math.max(1, Math.round(durationMs / 1000));
      const payload = {
        channelId: activeChannel.id,
        content: `[Telsiz Anonsu (${seconds} sn)]`,
        audioUrl: uploadedAudioUrl || audioUri,
        senderId: user?.id || "usr_eng_101",
        senderName: user?.name || "Kullanıcı",
        senderRole: user?.role || "ENGINEER",
        createdAt: new Date().toISOString(),
      };

      const socket = locationSocket.connect();
      socket.emit("sendMessage", payload);
      await api.post("/chat/messages", payload);
    } catch (err: any) {
      console.error("[Chat Voice Error]:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 6. Saha Fotoğrafı Gönder
  const handlePickImage = async () => {
    if (!activeChannel) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsSending(true);

        const payload = {
          channelId: activeChannel.id,
          content: "📷 [Saha Fotoğrafı]",
          imageUrl: asset.uri,
          senderId: user?.id || "usr_eng_101",
          senderName: user?.name || "Kullanıcı",
          senderRole: user?.role || "ENGINEER",
          createdAt: new Date().toISOString(),
        };

        const socket = locationSocket.connect();
        socket.emit("sendMessage", payload);
        await api.post("/chat/messages", payload);
      }
    } catch (err: any) {
      console.error("[Chat Photo Error]:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 7. Telsiz Ses Kaydını Çal (expo-audio)
  const handlePlayAudio = async (msgId: string, audioUrl: string) => {
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }

      if (playingMessageId === msgId) {
        setPlayingMessageId(null);
        return;
      }

      const fullUrl =
        audioUrl.startsWith("http") || audioUrl.startsWith("file://")
          ? audioUrl
          : `${WEB_BASE_URL}${audioUrl}`;

      const player = createAudioPlayer(fullUrl);
      soundRef.current = player;
      setPlayingMessageId(msgId);

      player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) {
          setPlayingMessageId(null);
          player.remove();
          if (soundRef.current === player) {
            soundRef.current = null;
          }
        }
      });

      player.play();
    } catch (err) {
      console.warn("[Chat Audio Play Error]:", err);
      setPlayingMessageId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
    };
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* ============================================================ */}
      {/* 1. ÜST HEADER (Akordiyon Kanal Seçici)                       */}
      {/* ============================================================ */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.liveRadioBadge}>
            <View style={styles.radioDot} />
            <Text style={styles.radioText}>CANLI TELSİZ</Text>
          </View>

          <TouchableOpacity
            style={styles.channelPickerButton}
            activeOpacity={0.75}
            onPress={() => setIsChannelSelectorOpen(!isChannelSelectorOpen)}
          >
            <Text style={styles.channelNameText}>
              {activeChannel?.name || "Kanal Seçiniz"}
            </Text>
            <Feather
              name={isChannelSelectorOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={iosColors.systemBlue}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.channelDropdownToggle}
          onPress={() => setIsChannelSelectorOpen(!isChannelSelectorOpen)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="radio-tower"
            size={22}
            color={iosColors.systemBlue}
          />
        </TouchableOpacity>
      </View>

      {/* Akordiyon Kanal Dropdown Menüsü */}
      {isChannelSelectorOpen && (
        <View style={styles.channelDropdown}>
          <Text style={styles.dropdownHeading}>Şantiyedeki Kanallar & Telsiz Grupları</Text>
          {(channels || []).map((ch) => {
            const isSelected = activeChannel?.id === ch.id;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.channelOption,
                  isSelected && styles.channelOptionActive,
                ]}
                onPress={() => {
                  setActiveChannel(ch);
                  setIsChannelSelectorOpen(false);
                }}
              >
                <MaterialCommunityIcons
                  name={
                    ch.name.includes("İSG")
                      ? "alert-decagram"
                      : ch.name.includes("Lojistik")
                      ? "truck"
                      : "radio-handheld"
                  }
                  size={20}
                  color={isSelected ? iosColors.systemBlue : iosColors.labelSecondary}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.channelOptionTitle,
                      isSelected && styles.channelOptionTitleActive,
                    ]}
                  >
                    {ch.name}
                  </Text>
                  {ch.description && (
                    <Text style={styles.channelOptionDesc}>{ch.description}</Text>
                  )}
                </View>
                {isSelected && (
                  <Feather name="check" size={16} color={iosColors.systemBlue} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. MESAJ LİSTESİ (iOS Balonları)                             */}
      {/* ============================================================ */}
      <View style={styles.messagesContainer}>
        {isLoadingMessages ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={iosColors.systemBlue} />
            <Text style={styles.loadingText}>Telsiz mesajları alınıyor...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === (user?.id || "usr_eng_101");
              const isVoice = Boolean(item.audioUrl);
              const isPlaying = playingMessageId === item.id;

              return (
                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowMe : styles.messageRowOther,
                  ]}
                >
                  {/* Karşı tarafın avatarı */}
                  {!isMe && (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>
                        {(item.sender?.name || "P").substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Konuşma Baloncuğu */}
                  <View
                    style={[
                      styles.bubbleBase,
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                      isVoice && styles.bubbleVoice,
                    ]}
                  >
                    {/* Gelen mesajda kullanıcı adı ve rol rozeti */}
                    {!isMe && (
                      <View style={styles.senderHeader}>
                        <Text style={styles.senderName}>
                          {item.sender?.name || "Personel"}
                        </Text>
                        <Text style={styles.senderRole}>
                          {item.sender?.role || "SAHA"}
                        </Text>
                      </View>
                    )}

                    {/* 1. Telsiz Ses Kaydı */}
                    {isVoice && (
                      <View style={styles.voiceContainer}>
                        <TouchableOpacity
                          style={[
                            styles.playPauseBtn,
                            isMe ? styles.playPauseBtnMe : styles.playPauseBtnOther,
                          ]}
                          onPress={() =>
                            item.audioUrl &&
                            handlePlayAudio(item.id, item.audioUrl)
                          }
                        >
                          <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={18}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>

                        <View style={styles.voiceDetails}>
                          {/* Ses Dalgası Barları */}
                          <View style={styles.barsRow}>
                            {[14, 22, 10, 26, 18, 12, 28, 16, 20, 10, 24, 14].map(
                              (h, i) => (
                                <View
                                  key={i}
                                  style={[
                                    styles.waveBar,
                                    { height: h },
                                    isPlaying && {
                                      backgroundColor: isMe
                                        ? "#FFFFFF"
                                        : iosColors.systemBlue,
                                    },
                                  ]}
                                />
                              )
                            )}
                          </View>
                          <Text
                            style={[
                              styles.voiceStatusText,
                              isMe && { color: "rgba(255, 255, 255, 0.85)" },
                            ]}
                          >
                            {isPlaying ? "Yürütülüyor..." : "🎙️ Telsiz Anonsu"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* 2. Fotoğraf Mesajı */}
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    )}

                    {/* 3. Metin Mesajı */}
                    {Boolean(item.content) && !isVoice && (
                      <Text
                        style={[
                          styles.messageText,
                          isMe ? styles.messageTextMe : styles.messageTextOther,
                        ]}
                      >
                        {item.content}
                      </Text>
                    )}

                    {/* Zaman & Tik */}
                    <View style={styles.metaRow}>
                      <Text
                        style={[
                          styles.timestampText,
                          isMe ? styles.timestampMe : styles.timestampOther,
                        ]}
                      >
                        {new Date(item.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {isMe && (
                        <MaterialCommunityIcons
                          name="check-all"
                          size={13}
                          color="#93C5FD"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* ============================================================ */}
      {/* 3. ALT GİRİŞ ÇUBUĞU (PTT Bas-Konuş & iOS Metin Girişi)         */}
      {/* ============================================================ */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <SafeAreaView edges={["bottom"]} style={styles.inputSafeArea}>
          <View style={styles.inputBar}>
            {/* Fotoğraf Butonu */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Feather name="camera" size={20} color={iosColors.labelSecondary} />
            </TouchableOpacity>

            {/* iOS Kavisli Metin Girişi */}
            <View style={styles.inputFieldWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Mesaj yaz veya telsizle anons geç..."
                placeholderTextColor={iosColors.labelMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
            </View>

            {/* Metin varsa Gönder, yoksa Bas-Konuş Telsiz Mandalı */}
            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={styles.sendButton}
                activeOpacity={0.8}
                onPress={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="arrow-up" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ) : (
              <PushToTalkButton
                onRecordingComplete={handleVoiceRecordingComplete}
                disabled={isSending}
              />
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: iosColors.background,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
    backgroundColor: "rgba(10, 15, 28, 0.95)",
  },
  headerLeft: {
    flex: 1,
  },
  liveRadioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: iosColors.systemGreen,
  },
  radioText: {
    color: iosColors.systemGreen,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  channelPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  channelNameText: {
    color: iosColors.labelPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  channelDropdownToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  channelDropdown: {
    backgroundColor: iosColors.backgroundSecondary,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: iosColors.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  dropdownHeading: {
    color: iosColors.labelSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  channelOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  channelOptionActive: {
    backgroundColor: "rgba(10, 122, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(10, 122, 255, 0.4)",
  },
  channelOptionTitle: {
    color: iosColors.labelSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  channelOptionTitleActive: {
    color: iosColors.systemBlue,
  },
  channelOptionDesc: {
    color: iosColors.labelMuted,
    fontSize: 11,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: iosColors.labelSecondary,
    fontSize: 12,
    marginTop: 10,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 2,
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  bubbleBase: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  // Kendi mesajları sağda iOS mavisi (#0A7AFF)
  bubbleMe: {
    backgroundColor: iosColors.systemBlue,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 4,
  },
  // Karşı tarafın mesajları solda koyu gri (rgba(255, 255, 255, 0.08))
  bubbleOther: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
  },
  bubbleVoice: {
    minWidth: 190,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    color: iosColors.systemBlue,
    fontSize: 11,
    fontWeight: "700",
  },
  senderRole: {
    color: iosColors.labelSecondary,
    fontSize: 9,
    fontWeight: "800",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  playPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playPauseBtnMe: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  playPauseBtnOther: {
    backgroundColor: iosColors.systemBlue,
  },
  voiceDetails: {
    flex: 1,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 30,
  },
  waveBar: {
    width: 3,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 1.5,
  },
  voiceStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: iosColors.labelSecondary,
    marginTop: 2,
  },
  messageImage: {
    width: 210,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  messageTextMe: {
    color: "#FFFFFF",
  },
  messageTextOther: {
    color: iosColors.labelPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 3,
  },
  timestampText: {
    fontSize: 10,
  },
  timestampMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  timestampOther: {
    color: iosColors.labelSecondary,
  },
  inputSafeArea: {
    backgroundColor: iosColors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: iosColors.glassBorder,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  cameraButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputFieldWrapper: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    borderWidth: 1,
    borderColor: iosColors.glassBorder,
  },
  textInput: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: iosColors.systemBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: iosColors.systemBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
