/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";

// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    filters?: BluetoothLEScanFilter[];
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
  }

  interface BluetoothLEScanFilter {
    namePrefix?: string;
    services?: string[];
  }
}

export default function BleScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState<any[]>([]);

  const scanForBleStickers = async () => {
    try {
      // Tarayıcının Web Bluetooth API'sini kullanıyoruz
      if (!navigator.bluetooth) {
        toast.error("Tarayıcınız veya cihazınız Bluetooth'u desteklemiyor (veya yetki yok).");
        return;
      }

      setIsScanning(true);
      toast.loading("Yakındaki BLE Etiketleri aranıyor...", { id: 'ble' });

      // Sadece belirli servislere sahip veya ismi olan cihazları filtreleyebiliriz
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        // İleride şirketinizin özel BLE etiketlerini filtrelemek için:
        // filters: [{ namePrefix: 'NEXA_AMBAR_' }] 
      });

      toast.success(`${device.name || "Bilinmeyen Cihaz"} bulundu!`, { id: 'ble' });
      
      // Bulunan cihazı listeye ekle (Burada MAC adresi güvenlik gereği doğrudan okunamayabilir,
      // ancak özel BLE servislerinden seri numarasını okuyan bir kurgu yapacağız).
      setDetectedDevices(prev => [...prev, { id: device.id, name: device.name }]);
      
    } catch (error) {
      console.error(error);
      toast.error("Tarama iptal edildi veya hata oluştu.", { id: 'ble' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-2">📡 BLE Etiket Tarayıcı</h3>
      <p className="text-sm text-slate-400 mb-4">Şantiyedeki veya depodaki Bluetooth (BLE) etiketli malzemeleri bulur.</p>
      
      <button 
        onClick={scanForBleStickers}
        disabled={isScanning}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {isScanning ? "Taranıyor..." : "Yakındaki Etiketleri Tara"}
      </button>

      {detectedDevices.length > 0 && (
        <ul className="mt-4 space-y-2">
          {detectedDevices.map((d, i) => (
            <li key={i} className="text-white text-sm bg-slate-700 p-2 rounded">
              📦 Bulunan: {d.name || d.id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
