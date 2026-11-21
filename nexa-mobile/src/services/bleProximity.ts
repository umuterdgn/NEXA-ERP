/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Zimmetli BLE Yakınlık & Ekipman Radarı Servisi (react-native-ble-plx)
 * - Yalnızca sunucudan (GET /api/mobile/ble/devices) dönen zimmetli etiketleri tarar (Sıfır Mock).
 * - RSSI değerlerini son 5 örnek üzerinden hareketli ortalama ile yumuşatır.
 * - Expo Go ortamında native modül yoksa çökmeden güvenli bilgilendirme moduna geçer.
 */

import Constants, { ExecutionEnvironment } from "expo-constants";
import { PermissionsAndroid, Platform } from "react-native";
import { mobileApi } from "./apiClient";
import { getCurrentGpsFix } from "./locationTracker";
import type { BleDeviceItem, BleProximityZone } from "../types/api";

export interface BleSupportStatus {
  supported: boolean;
  isExpoGo: boolean;
  reason?: string;
}

export interface BleTrackedDeviceState {
  device: BleDeviceItem;
  rssiHistory: number[];
  smoothedRssi: number | null;
  estimatedDistanceMeters: number | null;
  proximityZone: BleProximityZone | "UNKNOWN";
  lastPacketAt: number | null;
  signalLostAlertSent: boolean;
}

const RSSI_WINDOW_SIZE = 5;
const LOST_TIMEOUT_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 45_000;

export function normalizeBleId(val?: string | null): string {
  return String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function smoothRssiSample(
  prevHistory: number[],
  nextRssi: number,
  windowSize = RSSI_WINDOW_SIZE
): { history: number[]; smoothedRssi: number } {
  const updated = [...prevHistory, nextRssi].slice(-windowSize);
  const sum = updated.reduce((acc, v) => acc + v, 0);
  const avg = Math.round((sum / updated.length) * 10) / 10;
  return { history: updated, smoothedRssi: avg };
}

export function estimateBleDistanceMeters(
  rssi: number,
  txPower = -59,
  pathLossN = 2.2
): number {
  const ratio = (txPower - rssi) / (10 * pathLossN);
  const meters = Math.pow(10, ratio);
  return Math.max(0.1, Math.round(meters * 10) / 10);
}

export function classifyBleProximityZone(
  distanceMeters: number | null,
  silenceMs: number
): BleProximityZone {
  if (silenceMs > LOST_TIMEOUT_MS) return "LOST";
  if (distanceMeters == null) return "FAR";
  if (distanceMeters <= 1.5) return "IMMEDIATE";
  if (distanceMeters <= 5.0) return "NEAR";
  if (distanceMeters <= 20.0) return "FAR";
  return "LOST";
}

export function checkBleSupport(): BleSupportStatus {
  if (Platform.OS === "web") {
    return {
      supported: false,
      isExpoGo: false,
      reason: "Web tarayıcı ortamında Bluetooth Low Energy taraması desteklenmez.",
    };
  }

  let isExpoGo = false;
  try {
    isExpoGo =
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (Constants as any).appOwnership === "expo";
  } catch {}

  if (isExpoGo) {
    return {
      supported: false,
      isExpoGo: true,
      reason:
        "Canlı Bluetooth (BLE) taraması için Android Test APK / Dev Build gereklidir.",
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bleMod = require("react-native-ble-plx");
    if (!bleMod || typeof bleMod.BleManager !== "function") {
      return {
        supported: false,
        isExpoGo: false,
        reason:
          "Canlı Bluetooth (BLE) taraması için Android Test APK / Dev Build gereklidir.",
      };
    }
    return { supported: true, isExpoGo: false };
  } catch {
    return {
      supported: false,
      isExpoGo: false,
      reason:
        "Canlı Bluetooth (BLE) taraması için Android Test APK / Dev Build gereklidir.",
    };
  }
}

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  try {
    const apiLevel = Number(Platform.Version) || 31;
    if (apiLevel >= 31) {
      const res = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        res[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        res[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const locPerm = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return locPerm === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export type BleScanListener = (
  states: BleTrackedDeviceState[],
  meta: { isScanning: boolean; error?: string | null }
) => void;

class BleProximityService {
  private manager: any = null;
  private isScanning = false;
  private trackedMap = new Map<string, BleTrackedDeviceState>();
  private lastHeartbeatById = new Map<string, number>();
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private listener: BleScanListener | null = null;
  private activeProjectId?: string;
  private scanStartedAt = 0;

  private ensureManager(): any {
    if (this.manager) return this.manager;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bleMod = require("react-native-ble-plx");
    this.manager = new bleMod.BleManager();
    return this.manager;
  }

  private emit(error: string | null = null) {
    if (!this.listener) return;
    const list = Array.from(this.trackedMap.values());
    this.listener(list, { isScanning: this.isScanning, error });
  }

  seedDevices(devices: BleDeviceItem[]) {
    const next = new Map<string, BleTrackedDeviceState>();
    for (const dev of devices) {
      const existing = this.trackedMap.get(dev.id);
      next.set(dev.id, {
        device: dev,
        rssiHistory: existing?.rssiHistory || [],
        smoothedRssi: existing?.smoothedRssi ?? dev.lastRssi ?? null,
        estimatedDistanceMeters: existing?.estimatedDistanceMeters ?? null,
        proximityZone:
          existing?.proximityZone ||
          (dev.status === "LOST"
            ? "LOST"
            : (dev.proximityZone as BleProximityZone) || "UNKNOWN"),
        lastPacketAt: existing?.lastPacketAt ?? null,
        signalLostAlertSent: existing?.signalLostAlertSent ?? dev.status === "LOST",
      });
    }
    this.trackedMap = next;
    this.emit(null);
  }

  async startScan(
    devices: BleDeviceItem[],
    listener: BleScanListener,
    projectId?: string
  ): Promise<{ started: boolean; error?: string }> {
    this.listener = listener;
    this.activeProjectId = projectId;
    this.seedDevices(devices);

    const support = checkBleSupport();
    if (!support.supported) {
      this.emit(support.reason || null);
      return { started: false, error: support.reason };
    }

    const granted = await requestBlePermissions();
    if (!granted) {
      const msg = "Bluetooth tarama izinleri verilmedi.";
      this.emit(msg);
      return { started: false, error: msg };
    }

    if (devices.length === 0) {
      const msg = "Taranacak zimmetli BLE cihazı bulunamadı.";
      this.emit(msg);
      return { started: false, error: msg };
    }

    try {
      const mgr = this.ensureManager();
      const btState = await mgr.state().catch(() => "Unknown");
      if (btState === "PoweredOff") {
        const msg = "Bluetooth kapalı. Lütfen cihaz Bluetooth'unu açın.";
        this.emit(msg);
        return { started: false, error: msg };
      }

      this.stopScanOnly();
      this.isScanning = true;
      this.scanStartedAt = Date.now();
      this.emit(null);

      mgr.startDeviceScan(
        null,
        { allowDuplicates: true },
        (scanErr: any, scanned: any) => {
          if (scanErr) {
            this.isScanning = false;
            this.emit(scanErr?.message || "BLE tarama hatası.");
            return;
          }
          if (!scanned || typeof scanned.rssi !== "number" || scanned.rssi === 127) {
            return;
          }

          const scannedNormId = normalizeBleId(scanned.id);
          const scannedNormName = normalizeBleId(scanned.name || scanned.localName);
          const scannedUuids: string[] = Array.isArray(scanned.serviceUUIDs)
            ? scanned.serviceUUIDs.map((u: string) => normalizeBleId(u))
            : [];

          let matchedKey: string | null = null;
          for (const [id, state] of this.trackedMap.entries()) {
            const devMacNorm = normalizeBleId(state.device.macAddress);
            const devUuidNorm = normalizeBleId(state.device.uuid);
            const matchesMac =
              Boolean(devMacNorm) &&
              (scannedNormId === devMacNorm || scannedNormName === devMacNorm);
            const matchesUuid =
              Boolean(devUuidNorm) &&
              (scannedNormId === devUuidNorm || scannedUuids.includes(devUuidNorm));
            if (matchesMac || matchesUuid) {
              matchedKey = id;
              break;
            }
          }

          if (!matchedKey) return;

          const current = this.trackedMap.get(matchedKey)!;
          const { history, smoothedRssi } = smoothRssiSample(
            current.rssiHistory,
            scanned.rssi
          );
          const distanceMeters = estimateBleDistanceMeters(
            smoothedRssi,
            current.device.txPower || -59
          );
          const zone = classifyBleProximityZone(distanceMeters, 0);
          const now = Date.now();
          const wasLost = current.signalLostAlertSent || current.proximityZone === "LOST";

          this.trackedMap.set(matchedKey, {
            ...current,
            rssiHistory: history,
            smoothedRssi,
            estimatedDistanceMeters: distanceMeters,
            proximityZone: zone,
            lastPacketAt: now,
            signalLostAlertSent: false,
          });

          this.emit(null);

          const lastHb = this.lastHeartbeatById.get(matchedKey) || 0;
          if (wasLost || now - lastHb >= HEARTBEAT_INTERVAL_MS) {
            this.lastHeartbeatById.set(matchedKey, now);
            this.pushBleTelemetry({
              bleDeviceId: current.device.id,
              rssi: Math.round(smoothedRssi),
              estimatedDistanceMeters: distanceMeters,
              proximityZone: zone,
              bleEventType: wasLost ? "FOUND" : "HEARTBEAT",
            }).catch(() => {});
          }
        }
      );

      this.watchdogTimer = setInterval(() => {
        this.checkLostDevices().catch(() => {});
      }, 5000);

      return { started: true };
    } catch (err: any) {
      this.isScanning = false;
      const msg = err?.message || "BLE yöneticisi başlatılamadı.";
      this.emit(msg);
      return { started: false, error: msg };
    }
  }

  private async checkLostDevices() {
    if (!this.isScanning) return;
    const now = Date.now();
    let changed = false;

    for (const [id, st] of this.trackedMap.entries()) {
      const refTime = st.lastPacketAt ?? this.scanStartedAt;
      const silenceMs = now - refTime;

      if (silenceMs >= LOST_TIMEOUT_MS && st.proximityZone !== "LOST") {
        changed = true;
        this.trackedMap.set(id, {
          ...st,
          proximityZone: "LOST",
        });
      }

      if (silenceMs >= LOST_TIMEOUT_MS && !st.signalLostAlertSent) {
        const updated = this.trackedMap.get(id)!;
        this.trackedMap.set(id, {
          ...updated,
          proximityZone: "LOST",
          signalLostAlertSent: true,
        });
        changed = true;

        await this.pushBleTelemetry({
          bleDeviceId: st.device.id,
          rssi: st.smoothedRssi != null ? Math.round(st.smoothedRssi) : null,
          estimatedDistanceMeters: st.estimatedDistanceMeters,
          proximityZone: "LOST",
          bleEventType: "LOST_ALERT",
        }).catch(() => {});
      }
    }

    if (changed) {
      this.emit(null);
    }
  }

  private async pushBleTelemetry(opts: {
    bleDeviceId: string;
    rssi: number | null;
    estimatedDistanceMeters: number | null;
    proximityZone: BleProximityZone;
    bleEventType: "HEARTBEAT" | "LOST_ALERT" | "FOUND";
  }) {
    const fix = await getCurrentGpsFix();
    const state = this.trackedMap.get(opts.bleDeviceId);
    const lat = fix?.latitude ?? state?.device.lastLat;
    const lng = fix?.longitude ?? state?.device.lastLng;
    if (lat == null || lng == null) return;

    await mobileApi.telemetry.sendLocation({
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      source: "BLE",
      projectId: state?.device.projectId || this.activeProjectId,
      bleDeviceId: opts.bleDeviceId,
      rssi: opts.rssi,
      estimatedDistanceMeters: opts.estimatedDistanceMeters,
      proximityZone: opts.proximityZone,
      bleEventType: opts.bleEventType,
    });
  }

  stopScanOnly() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    try {
      this.manager?.stopDeviceScan?.();
    } catch {}
    this.isScanning = false;
  }

  stop() {
    this.stopScanOnly();
    this.emit(null);
  }
}

export const bleProximity = new BleProximityService();

