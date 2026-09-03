/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-hot-toast";

// Leaflet icon fix kodları
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SiteZone {
  id?: string;
  title: string;
  category: 'RISK' | 'BUILDING' | 'REST_AREA' | 'STORAGE';
  lat: number;
  lng: number;
  radius: number;
  supervisor?: string;
}

interface Personnel {
  id: string;
  name: string;
  department?: string;
  position?: string;
  currentSite?: string;
  lastCheckIn?: string;
}

interface Equipment {
  id: string;
  name: string;
  serialNumber?: string;
  type?: string;
  category?: string;
  status: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  lastLat?: number;
  lastLng?: number;
}

interface Props {
  projectLat: number;
  projectLng: number;
  projectId: string;
  userLocation?: {
    latitude: number | null;
    longitude: number | null;
    isTracking: boolean;
  };
}

const CATEGORY_COLORS = {
  RISK: '#ef4444',       // Kırmızı - Tehlike
  BUILDING: '#64748b',   // Gri - Bina Oturumu
  REST_AREA: '#10b981',  // Yeşil - Dinlenme/Toplanma Alanı
  STORAGE: '#3b82f6'     // Mavi - Depo/Ambar
};

const CATEGORY_LABELS = {
  RISK: '⚠️ Riskli Bölge',
  BUILDING: '🏢 Bina Alanı',
  REST_AREA: '☕ Dinlenme Alanı',
  STORAGE: '📦 Depo/Ambar'
};

// İşçi rollerine göre renkler
const ROLE_COLORS = {
  'İşçi': '#eab308',     // Sarı Baret
  'Formen': '#f97316',   // Turuncu Baret
  'Operatör': '#a855f7'  // Mor Baret
};

// Tarayıcı üzerinden dışa bağımlı olmadan çalışan Sesli Alarm (Siren) Sistemi
const playAlarm = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime); 
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2); 
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) { console.error("Audio blocked by browser", e); }
};

export default function SiteMasterPlan({ projectLat, projectLng, projectId, userLocation }: Props) {
  const [zones, setZones] = useState<SiteZone[]>([]);
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_COLORS>('BUILDING');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workers, setWorkers] = useState<{
    id: string,
    name: string,
    department?: string,
    position?: string,
    lat: number,
    lng: number,
    inDanger: boolean,
    timeOnSite: string
  }[]>([]);
  const [trackedEquipment, setTrackedEquipment] = useState<{
    id: string,
    name: string,
    serialNumber?: string,
    type?: string,
    category?: string,
    assignedToName?: string,
    lat: number,
    lng: number,
    inDanger: boolean
  }[]>([]);
  const [zoneModal, setZoneModal] = useState({ isOpen: false, lat: 0, lng: 0 });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: false, zoneId: string } | { isOpen: true, zoneId: string }>({ isOpen: false, zoneId: '' });
  const [modalForm, setModalForm] = useState({ title: '', radius: '10', supervisor: '' });

  // Fetch existing zones on component mount
  useEffect(() => {
    fetchZones();
    fetchPersonnel();
    fetchEquipment();
  }, [projectId]);

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('/api/admin/personnel');
      if (response.ok) {
        const data = await response.json();
        setPersonnel(data);
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/admin/equipments');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/site-zones?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedZones = data.map((z: any) => ({
          id: z.id,
          title: z.title,
          category: z.category as SiteZone['category'],
          lat: z.latitude,
          lng: z.longitude,
          radius: z.radius,
          supervisor: z.supervisor
        }));
        setZones(formattedZones);
      }
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      toast.error("Alanlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  function MapClick() {
    useMapEvents({
      click(e) {
        setZoneModal({ isOpen: true, lat: e.latlng.lat, lng: e.latlng.lng });
        setModalForm({ title: '', radius: '10', supervisor: '' });
      }
    });
    return null;
  }

  const createZone = async (zone: SiteZone) => {
    try {
      const response = await fetch('/api/admin/site-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: zone.title,
          category: zone.category,
          latitude: zone.lat,
          longitude: zone.lng,
          radius: zone.radius,
          supervisor: zone.supervisor
        })
      });

      if (response.ok) {
        const created = await response.json();
        setZones([...zones, { ...zone, id: created.id }]);
        toast.success("Alan başarıyla eklendi");
      } else {
        toast.error("Alan eklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Failed to create zone:", error);
      toast.error("Alan eklenirken hata oluştu");
    }
  };

  const deleteZone = async (zoneId: string) => {
    setDeleteModal({ isOpen: true, zoneId });
  };

  const confirmDelete = async () => {
    if (!deleteModal.isOpen) return;
    
    try {
      const response = await fetch(`/api/admin/site-zones/${deleteModal.zoneId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setZones(zones.filter(z => z.id !== deleteModal.zoneId));
        toast.success("Alan başarıyla silindi");
      } else {
        toast.error("Alan silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Failed to delete zone:", error);
      toast.error("Alan silinirken hata oluştu");
    } finally {
      setDeleteModal({ isOpen: false, zoneId: '' });
    }
  };

  const handleZoneSubmit = async () => {
    if (!modalForm.title) {
      toast.error("Bölge adı zorunludur");
      return;
    }
    
    const newZone: SiteZone = { 
      title: modalForm.title, 
      category: activeCategory, 
      lat: zoneModal.lat, 
      lng: zoneModal.lng, 
      radius: parseInt(modalForm.radius || "10"),
      supervisor: modalForm.supervisor || undefined
    };
    
    await createZone(newZone);
    setZoneModal({ isOpen: false, lat: 0, lng: 0 });
    setModalForm({ title: '', radius: '10', supervisor: '' });
  };

  // Haversine formülü ile iki koordinat arası metreyi bulur
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Dünya yarıçapı (metre)
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Client-side rendering için useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Worker and Equipment simulation useEffect - uses real data
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLiveTracking && projectLat && projectLng) {
      // Filter personnel who are at the current site
      const sitePersonnel = personnel.filter(p => 
        p.currentSite && p.currentSite.toLowerCase().includes('şantiye') || p.currentSite === 'Aktif'
      );
      
      // Filter equipment with location data
      const trackedEquip = equipment.filter(e => e.lastLat && e.lastLng);
      
      // Create workers from real personnel data
      if (workers.length === 0 && sitePersonnel.length > 0) {
        const initialWorkers = sitePersonnel.slice(0, 15).map((person) => {
          // Calculate time on site from last check-in
          let timeOnSite = 'Bilinmiyor';
          if (person.lastCheckIn) {
            const checkInTime = new Date(person.lastCheckIn);
            const now = new Date();
            const diffMs = now.getTime() - checkInTime.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            timeOnSite = diffHours > 0 ? `${diffHours}sa ${diffMins}dk` : `${diffMins}dk`;
          }
          
          return {
            id: person.id,
            name: person.name,
            department: person.department,
            position: person.position,
            lat: projectLat + (Math.random() - 0.5) * 0.002,
            lng: projectLng + (Math.random() - 0.5) * 0.002,
            inDanger: false,
            timeOnSite
          };
        });
        setWorkers(initialWorkers);
      }

      // Create tracked equipment from real equipment data
      if (trackedEquipment.length === 0 && trackedEquip.length > 0) {
        const initialTrackedEquipment = trackedEquip.map((eq) => ({
          id: eq.id,
          name: eq.name,
          serialNumber: eq.serialNumber,
          type: eq.type,
          category: eq.category,
          assignedToName: eq.assignedTo?.name,
          lat: eq.lastLat!,
          lng: eq.lastLng!,
          inDanger: false
        }));
        setTrackedEquipment(initialTrackedEquipment);
      }

      // Her 2 saniyede bir personeli ve ekipmanı rastgele hareket ettir
      interval = setInterval(() => {
        setWorkers(prevWorkers => prevWorkers.map(worker => {
          const newLat = worker.lat + (Math.random() - 0.5) * 0.0001;
          const newLng = worker.lng + (Math.random() - 0.5) * 0.0001;
          
          // Personel herhangi bir RISK alanının içine girdi mi?
          const riskZones = zones.filter(z => z.category === 'RISK');
          const inDanger = riskZones.some(zone => getDistance(newLat, newLng, zone.lat, zone.lng) <= zone.radius);
          
          // Tehlike bölgesine YENİ girildiyse
          if (inDanger && !worker.inDanger) {
            playAlarm(); // Sesli Sireni Çal!
            toast.error(`⚠️ DİKKAT! ${worker.name} tehlikeli bölgeye girdi!`, { 
              id: `danger-${worker.id}`,
              duration: 5000 
            });
          }

          return { ...worker, lat: newLat, lng: newLng, inDanger };
        }));

        setTrackedEquipment(prevEquip => prevEquip.map(eq => {
          const newLat = eq.lat + (Math.random() - 0.5) * 0.00005;
          const newLng = eq.lng + (Math.random() - 0.5) * 0.00005;
          
          // Ekipman herhangi bir RISK alanının içine girdi mi?
          const riskZones = zones.filter(z => z.category === 'RISK');
          const inDanger = riskZones.some(zone => getDistance(newLat, newLng, zone.lat, zone.lng) <= zone.radius);
          
          // Tehlike bölgesine YENİ girildiyse
          if (inDanger && !eq.inDanger) {
            playAlarm(); // Sesli Sireni Çal!
            toast.error(`⚠️ DİKKAT! ${eq.name} (${eq.serialNumber}) tehlikeli bölgeye girdi!`, { 
              id: `danger-eq-${eq.id}`,
              duration: 5000 
            });
          }

          return { ...eq, lat: newLat, lng: newLng, inDanger };
        }));
      }, 2000);
    } else {
      setWorkers([]); // Kapatılınca personeli temizle
      setTrackedEquipment([]); // Kapatılınca ekipmanı temizle
    }

    return () => clearInterval(interval);
  }, [isLiveTracking, projectLat, projectLng, zones, personnel, equipment]);

  if (!mounted) {
    return (
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-[600px] flex flex-col gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">🗺️ Şantiye Vaziyet Planı (Master Plan)</h3>
          <p className="text-xs text-slate-400">Haritaya tıklamadan önce aşağıdan ekleyeceğiniz alanın tipini seçin.</p>
        </div>
        <div className="flex-1 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-slate-400">Harita Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-[600px] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">🗺️ Şantiye Vaziyet Planı (Master Plan)</h3>
          <p className="text-xs text-slate-400">Haritaya tıklamadan önce aşağıdan ekleyeceğiniz alanın tipini seçin.</p>
        </div>
        
        {/* Kategori Seçici Butonlar */}
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategory === cat ? 'ring-2 ring-white text-white' : 'opacity-60 hover:opacity-100 text-slate-200'
              }`}
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
          <button
            onClick={() => setIsLiveTracking(!isLiveTracking)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-2 flex items-center gap-2 ${
              isLiveTracking ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'border-slate-600 text-slate-400 hover:border-slate-400'
            }`}
          >
            <span className={isLiveTracking ? 'animate-ping' : ''}>📡</span>
            {isLiveTracking ? 'Canlı İzleme AKTİF' : 'Canlı İzleme Başlat'}
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border border-slate-600 relative z-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-slate-400">Alanlar yükleniyor...</div>
          </div>
        ) : (
          <MapContainer center={[projectLat, projectLng]} zoom={17} maxZoom={22} style={{ width: "100%", height: "100%" }}>
            <TileLayer 
              attribution="&copy; Google" 
              maxNativeZoom={19} 
              maxZoom={22} 
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
            <MapClick/>
            
            {workers.map((worker) => (
              <CircleMarker 
                center={[worker.lat, worker.lng]} 
                radius={worker.inDanger ? 10 : 6}
                interactive={true}
                pathOptions={{
                  color: worker.inDanger ? '#ef4444' : '#3b82f6',
                  fillColor: worker.inDanger ? '#ef4444' : '#3b82f6',
                  fillOpacity: 1,
                  className: worker.inDanger ? 'animate-ping transition-all duration-1000' : 'transition-all duration-1000'
                }}
                key={worker.id}
                eventHandlers={{
                  click: (e) => {
                    e.target.openPopup();
                  }
                }}
              >
                <Popup className="iot-popup">
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="font-bold text-slate-800 border-b pb-2">
                      {worker.name}
                    </div>
                    
                    {worker.inDanger && (
                      <div className="bg-red-100 text-red-700 text-xs font-bold p-1.5 rounded text-center animate-pulse">
                        ⚠️ TEHLİKELİ BÖLGEDE
                      </div>
                    )}
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Birim:</span>
                        <span className="font-medium text-slate-700">{worker.department || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Görev:</span>
                        <span className="font-medium text-slate-700">{worker.position || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Şantiyede Süre:</span>
                        <span className="font-medium text-slate-700">{worker.timeOnSite}</span>
                      </div>
                    </div>
                    
                    <a
                      href={`/admin/personel/${worker.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 text-center transition-colors"
                    >
                      Detaya Git
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            
            {trackedEquipment.map((eq) => (
              <CircleMarker 
                center={[eq.lat, eq.lng]} 
                radius={eq.inDanger ? 10 : 6}
                interactive={true}
                pathOptions={{
                  color: eq.inDanger ? '#ef4444' : '#f97316',
                  fillColor: eq.inDanger ? '#ef4444' : '#f97316',
                  fillOpacity: 1,
                  className: eq.inDanger ? 'animate-ping transition-all duration-1000' : 'transition-all duration-1000'
                }}
                key={eq.id}
                eventHandlers={{
                  click: (e) => {
                    e.target.openPopup();
                  }
                }}
              >
                <Popup className="iot-popup">
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                      <span>🔧</span>
                      <span>{eq.name}</span>
                    </div>
                    
                    {eq.inDanger && (
                      <div className="bg-red-100 text-red-700 text-xs font-bold p-1.5 rounded text-center animate-pulse">
                        ⚠️ TEHLİKELİ BÖLGEDE
                      </div>
                    )}
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Seri No / MAC:</span>
                        <span className="font-mono font-medium text-slate-700">{eq.serialNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tür:</span>
                        <span className="font-medium text-slate-700">{eq.type || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kategori:</span>
                        <span className="font-medium text-slate-700">{eq.category || '-'}</span>
                      </div>
                      {eq.assignedToName && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Zimmetli:</span>
                          <span className="font-medium text-slate-700">{eq.assignedToName}</span>
                        </div>
                      )}
                    </div>
                    
                    <a
                      href={`/admin/inventory`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 text-center transition-colors"
                    >
                      Demirbaşa Git
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            
            {zones.map((zone, idx) => (
              <Circle 
                key={zone.id || idx} 
                center={[zone.lat, zone.lng]} 
                radius={zone.radius} 
                pathOptions={{ 
                  color: CATEGORY_COLORS[zone.category], 
                  fillColor: CATEGORY_COLORS[zone.category], 
                  fillOpacity: 0.5 
                }}
              >
                <Popup>
                  <div className="font-bold text-slate-800">{zone.title}</div>
                  <div className="text-xs font-semibold mt-1" style={{ color: CATEGORY_COLORS[zone.category] }}>
                    {CATEGORY_LABELS[zone.category]}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Çap: {zone.radius}m</div>
                  {zone.supervisor && (
                    <div className="text-xs text-slate-500 mt-1 border-t pt-1">
                      👤 Amir: {zone.supervisor}
                    </div>
                  )}
                  {zone.id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteZone(zone.id!);
                      }}
                      className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 w-full"
                    >
                      Sil
                    </button>
                  )}
                </Popup>
              </Circle>
            ))}

            {/* User Location Marker */}
            {userLocation?.isTracking && userLocation.latitude && userLocation.longitude && (
              <CircleMarker
                center={[userLocation.latitude, userLocation.longitude]}
                radius={8}
                interactive={true}
                pathOptions={{
                  color: '#00bcd4',
                  fillColor: '#00bcd4',
                  fillOpacity: 1,
                  className: 'animate-pulse'
                }}
              >
                <Popup className="user-location-popup">
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <div className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                      <span className="text-blue-500">📍</span>
                      <span>Siz Buradasınız</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Enlem:</span>
                        <span className="font-mono">{userLocation.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Boylam:</span>
                        <span className="font-mono">{userLocation.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium text-center mt-1">
                      Canlı Takip Aktif
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        )}
      </div>

      {/* Zone Creation Modal */}
      {zoneModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {CATEGORY_LABELS[activeCategory]} Ekle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bölge Adı *</label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({...modalForm, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Bölge adını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Çap (Metre) *</label>
                <input
                  type="number"
                  value={modalForm.radius}
                  onChange={(e) => setModalForm({...modalForm, radius: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sorumlu Amir (Opsiyonel)</label>
                <input
                  type="text"
                  value={modalForm.supervisor}
                  onChange={(e) => setModalForm({...modalForm, supervisor: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ahmet Yılmaz - 0532..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setZoneModal({ isOpen: false, lat: 0, lng: 0 });
                  setModalForm({ title: '', radius: '10', supervisor: '' });
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleZoneSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Alanı Sil</h3>
            <p className="text-slate-300 mb-6">Bu alanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, zoneId: '' })}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}