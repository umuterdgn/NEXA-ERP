/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Autonomous Engine Server Actions:
 * - Stage-Gate Enforcement & Validation
 * - FF&E (Fixtures, Furniture & Equipment) Logistics & Live Map Telemetry
 * - Legal & Official Permits Critical Path (CPM) Delay Risk Calculation
 * - Mobile-First Punch List & Automated Subcontractor DÖF (İş Emri) Generation
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { getFranchiseTenantId } from "@/app/actions/franchise"
import {
  ROLLOUT_STAGES,
  type RolloutStageKey,
  type StageGateDefinition,
  type FfeItem,
  type LegalPermitItem,
  type PunchListItemExt,
} from "@/lib/constants/franchise-constants"

// ============================================================================
// IN-MEMORY / DB HYBRID FALLBACK STORE (SANDBOX GÜVENLİĞİ VE PERSISTENCE İÇİN)
// ============================================================================

// Başlangıç mock mağazaları
const INITIAL_STORES = [
  {
    id: "store-kadikoy",
    name: "Kadıköy Moda Caddesi Şubesi",
    city: "İstanbul",
    district: "Kadıköy",
    locationType: "STREET",
    status: "MIMARI_PROJE",
    totalBudget: 4200000,
    progress: 35,
    constructionFinishDate: "2026-11-20",
    permitApprovalDate: "2026-11-28", // Gecikme riski var!
    architecturalDocUploaded: false,
    firePermitApproved: false,
    operatingLicenseApproved: false,
    stageGates: [
      { id: "sg-1", stageName: "YER_SECIMI", isApproved: true, isRequired: true, documentUrl: "/docs/kadikoy-kira.pdf" },
      { id: "sg-2", stageName: "MIMARI_PROJE", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-3", stageName: "SANCIYE_INSAAT", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-4", stageName: "FFE_KURULUM", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-5", stageName: "RESMI_IZINLER", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-6", stageName: "PRE_OPENING", isApproved: false, isRequired: true, documentUrl: null },
    ],
  },
  {
    id: "store-nisantasi",
    name: "Nişantaşı City's AVM Şubesi",
    city: "İstanbul",
    district: "Şişli",
    locationType: "MALL",
    status: "SANCIYE_INSAAT",
    totalBudget: 5800000,
    progress: 60,
    constructionFinishDate: "2026-11-15",
    permitApprovalDate: "2026-11-12", // Zamanında
    architecturalDocUploaded: true,
    firePermitApproved: false,
    operatingLicenseApproved: false,
    stageGates: [
      { id: "sg-10", stageName: "YER_SECIMI", isApproved: true, isRequired: true, documentUrl: "/docs/nisantasi-avm-kira.pdf" },
      { id: "sg-11", stageName: "MIMARI_PROJE", isApproved: true, isRequired: true, documentUrl: "/docs/nisantasi-mimari-v2.dwg" },
      { id: "sg-12", stageName: "SANCIYE_INSAAT", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-13", stageName: "FFE_KURULUM", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-14", stageName: "RESMI_IZINLER", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-15", stageName: "PRE_OPENING", isApproved: false, isRequired: true, documentUrl: null },
    ],
  },
  {
    id: "store-cankaya",
    name: "Ankara Çankaya Tunalı Şubesi",
    city: "Ankara",
    district: "Çankaya",
    locationType: "STREET",
    status: "FFE_KURULUM",
    totalBudget: 3900000,
    progress: 75,
    constructionFinishDate: "2026-11-10",
    permitApprovalDate: "2026-11-08",
    architecturalDocUploaded: true,
    firePermitApproved: true,
    operatingLicenseApproved: false,
    stageGates: [
      { id: "sg-20", stageName: "YER_SECIMI", isApproved: true, isRequired: true, documentUrl: "/docs/ankara-kira.pdf" },
      { id: "sg-21", stageName: "MIMARI_PROJE", isApproved: true, isRequired: true, documentUrl: "/docs/ankara-mimari.pdf" },
      { id: "sg-22", stageName: "SANCIYE_INSAAT", isApproved: true, isRequired: true, documentUrl: "/docs/ankara-insaat.pdf" },
      { id: "sg-23", stageName: "FFE_KURULUM", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-24", stageName: "RESMI_IZINLER", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-25", stageName: "PRE_OPENING", isApproved: false, isRequired: true, documentUrl: null },
    ],
  },
  {
    id: "store-alsancak",
    name: "İzmir Alsancak Kordon Şubesi",
    city: "İzmir",
    district: "Konak",
    locationType: "STREET",
    status: "RESMI_IZINLER",
    totalBudget: 4600000,
    progress: 88,
    constructionFinishDate: "2026-11-05",
    permitApprovalDate: "2026-11-18", // Gecikme riski var!
    architecturalDocUploaded: true,
    firePermitApproved: true,
    operatingLicenseApproved: false,
    stageGates: [
      { id: "sg-30", stageName: "YER_SECIMI", isApproved: true, isRequired: true, documentUrl: "/docs/izmir-kira.pdf" },
      { id: "sg-31", stageName: "MIMARI_PROJE", isApproved: true, isRequired: true, documentUrl: "/docs/izmir-mimari.pdf" },
      { id: "sg-32", stageName: "SANCIYE_INSAAT", isApproved: true, isRequired: true, documentUrl: "/docs/izmir-insaat.pdf" },
      { id: "sg-33", stageName: "FFE_KURULUM", isApproved: true, isRequired: true, documentUrl: "/docs/izmir-ffe.pdf" },
      { id: "sg-34", stageName: "RESMI_IZINLER", isApproved: false, isRequired: true, documentUrl: null },
      { id: "sg-35", stageName: "PRE_OPENING", isApproved: false, isRequired: true, documentUrl: null },
    ],
  },
  {
    id: "store-bursa",
    name: "Bursa Korupark Kiosk Şubesi",
    city: "Bursa",
    district: "Nilüfer",
    locationType: "KIOSK",
    status: "PRE_OPENING",
    totalBudget: 2200000,
    progress: 98,
    constructionFinishDate: "2026-10-25",
    permitApprovalDate: "2026-10-28",
    architecturalDocUploaded: true,
    firePermitApproved: true,
    operatingLicenseApproved: true,
    stageGates: [
      { id: "sg-40", stageName: "YER_SECIMI", isApproved: true, isRequired: true, documentUrl: "/docs/bursa-kiosk.pdf" },
      { id: "sg-41", stageName: "MIMARI_PROJE", isApproved: true, isRequired: true, documentUrl: "/docs/bursa-mimari.pdf" },
      { id: "sg-42", stageName: "SANCIYE_INSAAT", isApproved: true, isRequired: true, documentUrl: "/docs/bursa-insaat.pdf" },
      { id: "sg-43", stageName: "FFE_KURULUM", isApproved: true, isRequired: true, documentUrl: "/docs/bursa-ffe.pdf" },
      { id: "sg-44", stageName: "RESMI_IZINLER", isApproved: true, isRequired: true, documentUrl: "/docs/bursa-izinler.pdf" },
      { id: "sg-45", stageName: "PRE_OPENING", isApproved: true, isRequired: true, documentUrl: "/docs/bursa-kabul.pdf" },
    ],
  },
]

const INITIAL_FFE_ITEMS: FfeItem[] = [
  {
    id: "ffe-1",
    code: "FFE-BAR-001",
    name: "Sanremo Cafe Racer 3 Gruplu Özel Seri Espresso Makinesi",
    category: "Bar & Mutfak",
    quantity: 1,
    unit: "Adet",
    supplier: "Barista Tech Endüstriyel Ltd.",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    status: "Yolda",
    orderDate: "2026-10-28",
    etaDate: "2026-11-08",
    serialNo: "SAN-2026-CR-9921",
    trackingInfo: {
      carrierName: "Nexa Soğuk & Hassas Lojistik",
      driverName: "Kemal Demir",
      driverPhone: "+90 532 884 1920",
      plateNumber: "34 VR 8921",
      currentCity: "Kocaeli / Gebze Çıkışı",
      originCity: "Gebze Merkez Lojistik Deposu",
      destinationCity: "İstanbul / Kadıköy Şantiyesi",
      currentLat: 40.8021,
      currentLng: 29.4312,
      speedKmH: 72,
      etaRemaining: "1 saat 35 dakika (Bugün 15:45)",
      batteryLevel: 94,
      cargoTemp: "+21°C (Kuru & Sabit)",
    },
  },
  {
    id: "ffe-2",
    code: "FFE-POS-002",
    name: "Ingenico Dokunmatik Entegre POS & Yazarkasa Terminal Seti",
    category: "Bilişim & POS",
    quantity: 3,
    unit: "Set",
    supplier: "POS Sistemleri Çözüm A.Ş.",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    status: "Depoda",
    orderDate: "2026-10-25",
    etaDate: "2026-11-04",
    serialNo: "ING-IP350-SET3",
  },
  {
    id: "ffe-3",
    code: "FFE-ADV-003",
    name: "Dış Cephe Çift Yönlü Işıklı Alüminyum Kutu Harf Tabela",
    category: "Reklam & Tabela",
    quantity: 1,
    unit: "Takım",
    supplier: "NeonLine Endüstriyel Reklamcılık",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    status: "Siparişte",
    orderDate: "2026-11-01",
    etaDate: "2026-11-14",
    serialNo: "TAB-LED-KDK-01",
  },
  {
    id: "ffe-4",
    code: "FFE-BAR-004",
    name: "Brema CB 425A Endüstriyel Kristal Buz Makinesi (Günde 47kg)",
    category: "Bar & Mutfak",
    quantity: 1,
    unit: "Adet",
    supplier: "Endüstriyel Soğutma Market",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    status: "Yolda",
    orderDate: "2026-10-29",
    etaDate: "2026-11-07",
    serialNo: "BRM-425A-781",
    trackingInfo: {
      carrierName: "Ekol Ekspres Kargo",
      driverName: "Murat Çakır",
      driverPhone: "+90 533 119 4432",
      plateNumber: "16 BRS 410",
      currentCity: "Yalova / Osmangazi Köprüsü Girişi",
      originCity: "Bursa Dağıtım Ambarı",
      destinationCity: "İstanbul / Kadıköy Şantiyesi",
      currentLat: 40.7312,
      currentLng: 29.5142,
      speedKmH: 84,
      etaRemaining: "1 saat 10 dakika",
      batteryLevel: 88,
      cargoTemp: "+19°C",
    },
  },
  {
    id: "ffe-5",
    code: "FFE-REF-005",
    name: "Sevel Özel Tasarım Çift Katlı Pasta & Sandviç Teşhir Dolabı",
    category: "Bar & Mutfak",
    quantity: 2,
    unit: "Adet",
    supplier: "Sevel Soğutma Sistemleri",
    storeId: "store-nisantasi",
    storeName: "Nişantaşı City's AVM Şubesi",
    status: "Sahaya Kuruldu",
    orderDate: "2026-10-15",
    etaDate: "2026-10-29",
    serialNo: "SVL-REF-2026-081",
  },
  {
    id: "ffe-6",
    code: "FFE-BAR-006",
    name: "Winterhalter UC-M Endüstriyel Bardak ve Bulaşık Makinesi",
    category: "Bar & Mutfak",
    quantity: 1,
    unit: "Adet",
    supplier: "Winterhalter Türkiye",
    storeId: "store-nisantasi",
    storeName: "Nişantaşı City's AVM Şubesi",
    status: "Sahaya Kuruldu",
    orderDate: "2026-10-18",
    etaDate: "2026-10-31",
    serialNo: "WNT-UCM-55412",
  },
  {
    id: "ffe-7",
    code: "FFE-FUR-007",
    name: "Masif Meşe Yuvarlak & Dikdörtgen Kafe Masa Grubu",
    category: "Mobilya & Dekor",
    quantity: 14,
    unit: "Takım",
    supplier: "Studio Craft Mobilya Sanayi",
    storeId: "store-cankaya",
    storeName: "Ankara Çankaya Tunalı Şubesi",
    status: "Yolda",
    orderDate: "2026-10-30",
    etaDate: "2026-11-09",
    serialNo: "OAK-FURN-ANK-14",
    trackingInfo: {
      carrierName: "Horoz Lojistik Ağır Yük Filosu",
      driverName: "Süleyman Aksoy",
      driverPhone: "+90 544 321 9801",
      plateNumber: "06 LJT 99",
      currentCity: "Kızılcahamam Otoban Ayrımı",
      originCity: "İnegöl Mobilya OSB",
      destinationCity: "Ankara / Tunalı Hilmi Şantiyesi",
      currentLat: 40.518,
      currentLng: 32.651,
      speedKmH: 78,
      etaRemaining: "1 saat 50 dakika",
      batteryLevel: 91,
    },
  },
  {
    id: "ffe-8",
    code: "FFE-AV-008",
    name: "Bose FreeSpace Çok Bölgeli Kurumsal Ses & Arka Plan Müzik Seti",
    category: "Güvenlik & Ses",
    quantity: 1,
    unit: "Set",
    supplier: "SesPro Profesyonel Akustik",
    storeId: "store-alsancak",
    storeName: "İzmir Alsancak Kordon Şubesi",
    status: "Sahaya Kuruldu",
    orderDate: "2026-10-20",
    etaDate: "2026-11-02",
    serialNo: "BOS-FS-IZM-09",
  },
  {
    id: "ffe-9",
    code: "FFE-SEC-009",
    name: "Hikvision 8 Kanal 4K IP Kamera & Bulut NVR Güvenlik Paketi",
    category: "Güvenlik & Ses",
    quantity: 1,
    unit: "Set",
    supplier: "GüvenNet Bilişim ve Kamera Ltd.",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    status: "Depoda",
    orderDate: "2026-10-24",
    etaDate: "2026-11-05",
    serialNo: "HK-NVR8-2026",
  },
  {
    id: "ffe-10",
    code: "FFE-VAC-010",
    name: "Daikin VRV Kaset Tipi İnverter İklimlendirme ve Hava Perdesi",
    category: "İklimlendirme",
    quantity: 2,
    unit: "Set",
    supplier: "Daikin İklimlendirme Türkiye",
    storeId: "store-cankaya",
    storeName: "Ankara Çankaya Tunalı Şubesi",
    status: "Sahaya Kuruldu",
    orderDate: "2026-10-12",
    etaDate: "2026-10-26",
    serialNo: "DKN-VRV-ANK-02",
  },
]

const INITIAL_LEGAL_PERMITS: LegalPermitItem[] = [
  {
    id: "leg-1",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    permitName: "İtfaiye Yangın Uygunluk Raporu",
    authority: "İstanbul Büyükşehir Belediyesi İtfaiye Daire Bşk.",
    officerInCharge: "Mühendis Ali Rıza Güneş",
    status: "GECIKMEDE",
    applicationDate: "2026-10-15",
    estimatedApprovalDate: "2026-11-28", // İnşaat bitişi: 2026-11-20 -> 8 GÜN GECİKME!
    constructionFinishDate: "2026-11-20",
    isCriticalPath: true,
    documentUrl: "/docs/kadikoy-itfaiye-basvuru.pdf",
    notes: "İtfaiye saha denetim ekibi yoğunluk nedeniyle keşif randevusunu 24 Kasım'a erteledi. İnşaat bitiminden sonra onaylanacağı için kritik yol gecikmesi oluşturmaktadır.",
  },
  {
    id: "leg-2",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    permitName: "İşyeri Açma ve Çalışma Ruhsatı",
    authority: "Kadıköy Belediyesi Ruhsat ve Denetim Md.",
    officerInCharge: "Ruhsat Şefi Selin Arslan",
    status: "EVRAK_INCELEMESI",
    applicationDate: "2026-10-20",
    estimatedApprovalDate: "2026-11-29",
    constructionFinishDate: "2026-11-20",
    isCriticalPath: true,
    documentUrl: "/docs/kadikoy-ruhsat-dosyasi.pdf",
    notes: "İtfaiye raporu sonuçlanmadan ruhsat teslim edilemez (Müteselsil kritik yol).",
  },
  {
    id: "leg-3",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    permitName: "Elektrik Şantiye Sayacı Dönüşümü & Trafo Kabulü",
    authority: "Ayedaş Anadolu Yakası Elektrik Dağıtım A.Ş.",
    officerInCharge: "Teknik Uzman Erkan Yıldız",
    status: "KESIF_BEKLENIYOR",
    applicationDate: "2026-10-18",
    estimatedApprovalDate: "2026-11-18",
    constructionFinishDate: "2026-11-20",
    isCriticalPath: false,
    documentUrl: "/docs/ayedas-kabul-formu.pdf",
  },
  {
    id: "leg-4",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    permitName: "Şebeke Su ve Kanalizasyon Aboneliği",
    authority: "İSKİ Kadıköy Şube Müdürlüğü",
    officerInCharge: "Abonman Memuru Hakan Polat",
    status: "ONAYLANDI",
    applicationDate: "2026-10-10",
    estimatedApprovalDate: "2026-10-28",
    actualApprovalDate: "2026-10-26",
    constructionFinishDate: "2026-11-20",
    isCriticalPath: false,
    documentUrl: "/docs/iski-abone-sozlesmesi.pdf",
  },
  {
    id: "leg-5",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    permitName: "Kurumsal Fiber İnternet & Statik IP Tahsisi",
    authority: "Türk Telekom Kurumsal Bölge Temsilciliği",
    officerInCharge: "Müşteri Temsilcisi Gizem Demir",
    status: "EVRAK_INCELEMESI",
    applicationDate: "2026-10-22",
    estimatedApprovalDate: "2026-11-12",
    constructionFinishDate: "2026-11-20",
    isCriticalPath: false,
    documentUrl: "/docs/tt-fiber-talep.pdf",
  },
  {
    id: "leg-6",
    storeId: "store-nisantasi",
    storeName: "Nişantaşı City's AVM Şubesi",
    permitName: "AVM İçi Yangın Merdiveni ve Sprinkler Uygunluk",
    authority: "City's AVM Teknik Yönetim Kurulu",
    officerInCharge: "Teknik Md. Kerem Soyer",
    status: "ONAYLANDI",
    applicationDate: "2026-10-10",
    estimatedApprovalDate: "2026-10-25",
    actualApprovalDate: "2026-10-24",
    constructionFinishDate: "2026-11-15",
    isCriticalPath: true,
    documentUrl: "/docs/citys-yangin-onay.pdf",
  },
  {
    id: "leg-7",
    storeId: "store-alsancak",
    storeName: "İzmir Alsancak Kordon Şubesi",
    permitName: "İtfaiye Yangın Uygunluk Raporu",
    authority: "İzmir BŞB İtfaiye Daire Bşk.",
    officerInCharge: "Denetmen Cengiz Baran",
    status: "GECIKMEDE",
    applicationDate: "2026-10-12",
    estimatedApprovalDate: "2026-11-18", // İnşaat bitişi: 2026-11-05 -> 13 GÜN GECİKME!
    constructionFinishDate: "2026-11-05",
    isCriticalPath: true,
    documentUrl: "/docs/izmir-itfaiye.pdf",
    notes: "Acil itiraz dilekçesi verildi, hızlandırma için genel müdürlük devreye sokuldu.",
  },
]

const INITIAL_PUNCH_ITEMS: PunchListItemExt[] = [
  {
    id: "punch-1",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    subcontractorId: "sub-1",
    subcontractorName: "Delta Elektrik & Aydınlatma Taahhüt Ltd.",
    defectDesc: "Dış cephe logo kutu harf sol LED aydınlatması temassızlık yapıyor ve titriyor.",
    locationFloor: "Zemin Kat - Giriş Cephesi",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?q=80&w=800&auto=format&fit=crop",
    priority: "KRITIK",
    status: "OPEN",
    deadline: "2026-11-12",
    createdAt: "2026-11-06T10:30:00Z",
    taskId: "task-dof-101",
  },
  {
    id: "punch-2",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    subcontractorId: "sub-2",
    subcontractorName: "Aksoy Alçıpan & Boya Sanayi",
    defectDesc: "Bar arka duvarı antrasit boyasında rulo izi ve kılcal macun çatlakları mevcut.",
    locationFloor: "Zemin Kat - Bar Arkası",
    photoUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
    priority: "YUKSEK",
    status: "FIXED",
    deadline: "2026-11-10",
    createdAt: "2026-11-05T14:20:00Z",
    taskId: "task-dof-102",
  },
  {
    id: "punch-3",
    storeId: "store-kadikoy",
    storeName: "Kadıköy Moda Caddesi Şubesi",
    subcontractorId: "sub-3",
    subcontractorName: "Marmara Sıhhi Tesisat & Mekanik",
    defectDesc: "Müşteri engelli WC lavabo bataryasında su sızıntısı var, basınç düşürücü takılmalı.",
    locationFloor: "Bodrum Kat - Islak Hacimler",
    photoUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
    priority: "NORMAL",
    status: "OPEN",
    deadline: "2026-11-14",
    createdAt: "2026-11-06T11:45:00Z",
    taskId: "task-dof-103",
  },
  {
    id: "punch-4",
    storeId: "store-nisantasi",
    storeName: "Nişantaşı City's AVM Şubesi",
    subcontractorId: "sub-1",
    subcontractorName: "Delta Elektrik & Aydınlatma Taahhüt Ltd.",
    defectDesc: "Acil çıkış yönlendirme armatürü (Exit tabelası) akü testi başarısız oldu.",
    locationFloor: "Kat 2 - Mağaza Girişi",
    photoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    priority: "KRITIK",
    status: "VERIFIED",
    deadline: "2026-11-08",
    createdAt: "2026-11-03T09:15:00Z",
    taskId: "task-dof-104",
  },
  {
    id: "punch-5",
    storeId: "store-bursa",
    storeName: "Bursa Korupark Kiosk Şubesi",
    subcontractorId: "sub-2",
    subcontractorName: "Aksoy Alçıpan & Boya Sanayi",
    defectDesc: "Kiosk köşe koruma paslanmaz çıtası gevşek, perçin tazelenecek.",
    locationFloor: "Zemin Kat Kiosk Alanı",
    photoUrl: null,
    priority: "DUSUK",
    status: "VERIFIED",
    deadline: "2026-10-27",
    createdAt: "2026-10-24T16:00:00Z",
    taskId: "task-dof-105",
  },
]

// ============================================================================
// ADIM 1: STAGE-GATE DOĞRULAMA VE GEÇİŞ KONTROLÜ (AUTONOMOUS LOGIC)
// ============================================================================

/**
 * Bir şubenin hedef aşamaya geçiş yapıp yapamayacağını doğrular.
 * Mimari Proje olmadan İnşaat'a GEÇİLEMEZ.
 * Resmi izinler ve 0 punch list olmadan Pre-Opening'e GEÇİLEMEZ.
 */
export async function validateStageGateTransition(
  storeId: string,
  targetStage: RolloutStageKey
): Promise<{
  allowed: boolean
  code?: string
  missingItem?: string
  missingDoc?: string
  reason?: string
  blockingDetails?: any
  details?: any
}> {
  try {
    // 1. Projeyi bul
    let store = INITIAL_STORES.find((s) => s.id === storeId)

    // Prisma DB sorgusu dene
    try {
      const dbProject = await prisma.rolloutProject.findUnique({
        where: { id: storeId },
        include: { stageGates: true },
      })
      if (dbProject) {
        // DB verisi ile senkronize et
        const archGate = dbProject.stageGates.find((g) => g.stageName === "MIMARI_PROJE")
        const currentStage = dbProject.status as RolloutStageKey
        store = {
          id: dbProject.id,
          name: dbProject.name,
          city: dbProject.city,
          district: "",
          locationType: dbProject.locationType,
          status: currentStage,
          totalBudget: dbProject.totalBudget,
          progress: 50,
          constructionFinishDate: "2026-11-20",
          permitApprovalDate: "2026-11-25",
          architecturalDocUploaded: Boolean(archGate?.isApproved || archGate?.documentUrl),
          firePermitApproved: false,
          operatingLicenseApproved: false,
          stageGates: dbProject.stageGates.map((g) => ({
            id: g.id,
            stageName: g.stageName || "",
            isApproved: g.isApproved,
            isRequired: g.isRequired,
            documentUrl: g.documentUrl,
          })),
        }
      }
    } catch {
      // Offline fallback
    }

    if (!store) {
      return { allowed: false, reason: "Şube projesi bulunamadı." }
    }

    // AŞAMA 1: ŞANTİYE & İNŞAAT GEÇİŞ KİLİDİ
    // "Mimari Proje yüklenmeden kart 'İnşaat' sütununa geçemez (Uyarı verir)"
    if (targetStage === "SANCIYE_INSAAT") {
      const isArchApproved = store.architecturalDocUploaded || store.stageGates.find((g) => g.stageName === "MIMARI_PROJE")?.isApproved
      if (!isArchApproved) {
        return {
          allowed: false,
          code: "MISSING_ARCHITECTURAL_APPROVAL",
          missingItem: "Onaylı Mimari Uygulama Projesi (.dwg / .pdf)",
          missingDoc: "Onaylı Mimari Uygulama Projesi (.dwg / .pdf)",
          reason:
            "ZORUNLU ONAY KAPISI ENGELİ (Stage-Gate): Onaylı Mimari Uygulama Projesi yüklenip onaylanmadan şantiye imalatına geçilemez!",
          blockingDetails: {
            requiredStage: "Mimari Proje & Onay",
            requiredAction: "Lütfen Mimari Proje evrakını yükleyiniz veya Mimari Proje sekmesinden onay alınız.",
          },
          details: {
            requiredStage: "Mimari Proje & Onay",
            requiredAction: "Lütfen Mimari Proje evrakını yükleyiniz veya Mimari Proje sekmesinden onay alınız.",
          },
        }
      }
    }

    // AŞAMA 2: FF&E KURULUMU GEÇİŞ KİLİDİ
    if (targetStage === "FFE_KURULUM") {
      // Şantiye inşaat aşamasının ilerlemiş veya tamamlanmış olması gerekir
      const isConApproved = store.stageGates.find((g) => g.stageName === "SANCIYE_INSAAT")?.isApproved
      if (!isConApproved && store.status === "MIMARI_PROJE") {
        return {
          allowed: false,
          code: "MISSING_CONSTRUCTION_GATE",
          missingItem: "Şantiye İlerleme & İnce İmalat Kabulü",
          missingDoc: "Şantiye İlerleme & İnce İmalat Kabulü",
          reason: "Şantiye kaba ve ince imalat süreci tamamlanmadan FF&E demirbaş montajına geçilemez.",
        }
      }
    }

    // AŞAMA 3: PRE-OPENING (AÇILIŞ PROVASI) GEÇİŞ KİLİDİ
    // Resmi izinler onaylanmış olmalı + 0 açık Punch List kusuru olmalı!
    if (targetStage === "PRE_OPENING") {
      // 1. Punch list açık kusur kontrolü
      const openDefects = INITIAL_PUNCH_ITEMS.filter(
        (p) => p.storeId === storeId && p.status !== "VERIFIED"
      )

      if (openDefects.length > 0) {
        return {
          allowed: false,
          code: "PUNCH_LIST_BLOCKER",
          missingItem: `Sıfır Kusur Şartı (${openDefects.length} Adet Açık Kusur Bulunuyor)`,
          missingDoc: `Sıfır Kusur Şartı (${openDefects.length} Adet Açık Kusur Bulunuyor)`,
          reason: `AÇILIŞ KİLİDİ (Pre-Opening Blocker): Bu şubede henüz doğrulanmamış (VERIFIED yapılmamış) ${openDefects.length} adet kusur kaydı bulunmaktadır. Tüm Punch List maddeleri kapatılmadan şube Açılışa Hazır statüsüne alınamaz!`,
          blockingDetails: {
            openDefectsCount: openDefects.length,
            defects: openDefects.map((d) => ({
              id: d.id,
              desc: d.defectDesc,
              status: d.status,
              priority: d.priority,
            })),
          },
          details: {
            openDefectsCount: openDefects.length,
            defects: openDefects.map((d) => ({
              id: d.id,
              desc: d.defectDesc,
              status: d.status,
              priority: d.priority,
            })),
          },
        }
      }

      // 2. Resmi izinler kontrolü
      const pendingPermits = INITIAL_LEGAL_PERMITS.filter(
        (lp) => lp.storeId === storeId && lp.isCriticalPath && lp.status !== "ONAYLANDI"
      )

      if (pendingPermits.length > 0) {
        return {
          allowed: false,
          code: "LEGAL_PERMITS_BLOCKER",
          missingItem: `Resmi İzinler & Ruhsat Onayı (${pendingPermits.map((p) => p.permitName).join(", ")})`,
          missingDoc: `Resmi İzinler & Ruhsat Onayı (${pendingPermits.map((p) => p.permitName).join(", ")})`,
          reason: `RESMİ İZİN ENGELİ: Şantiye için kritik yol üstündeki resmi izinler (${pendingPermits.length} adet) henüz onaylanmamıştır. İtfaiye Uygunluk ve İşyeri Ruhsatı olmadan şube açılış provası yapılamaz!`,
          blockingDetails: {
            pendingPermits: pendingPermits.map((p) => p.permitName),
          },
          details: {
            pendingPermits: pendingPermits.map((p) => p.permitName),
          },
        }
      }
    }

    return { allowed: true }
  } catch (error: any) {
    console.error("validateStageGateTransition error:", error)
    return { allowed: false, reason: error.message || "Doğrulama sırasında hata oluştu" }
  }
}

/**
 * Kanban Panosunda Kartı Yeni Aşamaya Sürükle / Güncelle
 */
export async function updateRolloutBoardStage(
  storeId: string,
  newStage: RolloutStageKey,
  forceOverride: boolean = false
) {
  try {
    if (!forceOverride) {
      const validation = await validateStageGateTransition(storeId, newStage)
      if (!validation.allowed) {
        return {
          success: false,
          blocked: true,
          validation,
          error: validation.reason,
        }
      }
    }

    // In-memory senkronizasyonu
    const localStore = INITIAL_STORES.find((s) => s.id === storeId)
    if (localStore) {
      localStore.status = newStage
      const gateIndex = ROLLOUT_STAGES.findIndex((st) => st.key === newStage)
      if (gateIndex >= 0) {
        localStore.progress = Math.min(100, Math.round(((gateIndex + 1) / ROLLOUT_STAGES.length) * 100))
      }
    }

    // Prisma DB güncellemesi
    try {
      await prisma.rolloutProject.update({
        where: { id: storeId },
        data: {
          status: newStage,
        },
      })
    } catch {
      // Prisma offline mode
    }

    revalidatePath("/franchise/rollout")
    revalidatePath("/franchise/rollout/board")
    return { success: true, newStage }
  } catch (error: any) {
    console.error("updateRolloutBoardStage error:", error)
    return { success: false, error: error.message || "Aşama güncellenemedi" }
  }
}

/**
 * Tüm Rollout Projelerini Kanban Verisi Olarak Getir
 */
export async function getRolloutBoardData() {
  try {
    // 1. Prisma DB dene
    try {
      const dbProjects = await prisma.rolloutProject.findMany({
        include: {
          stageGates: true,
          expenses: true,
          workProofs: true,
          regionalManager: { select: { id: true, name: true } },
          branchManager: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      if (dbProjects && dbProjects.length > 0) {
        const enriched = dbProjects.map((p) => {
          const punchCount = INITIAL_PUNCH_ITEMS.filter(
            (pi) => pi.storeId === p.id && pi.status !== "VERIFIED"
          ).length
          const currentStageIndex = ROLLOUT_STAGES.findIndex((s) => s.key === p.status)
          const progress = currentStageIndex >= 0 ? Math.round(((currentStageIndex + 1) / 6) * 100) : 20

          return {
            id: p.id,
            name: p.name,
            city: p.city,
            district: "",
            locationType: p.locationType,
            status: p.status as RolloutStageKey,
            totalBudget: p.totalBudget || 4500000,
            progress,
            constructionFinishDate: "2026-11-20",
            permitApprovalDate: "2026-11-25",
            stageGates: p.stageGates.map((sg) => ({
              id: sg.id,
              stageName: sg.stageName || "",
              isApproved: sg.isApproved,
              isRequired: sg.isRequired,
              documentUrl: sg.documentUrl,
            })),
            openDefects: punchCount,
            regionalManagerName: p.regionalManager?.name || "Ahmet Yılmaz",
            branchManagerName: p.branchManager?.name || "Gizem Öz",
          }
        })
        return { success: true, projects: enriched }
      }
    } catch {
      // Offline fallback
    }

    // In-memory fallback
    const enrichedFallback = INITIAL_STORES.map((s) => ({
      ...s,
      openDefects: INITIAL_PUNCH_ITEMS.filter((p) => p.storeId === s.id && p.status !== "VERIFIED").length,
      regionalManagerName: "Bölge Müdürü (Ahmet Yılmaz)",
      branchManagerName: "Şube Müdürü (Gizem Öz)",
    }))

    return { success: true, projects: enrichedFallback }
  } catch (error: any) {
    return { success: false, error: error.message, projects: INITIAL_STORES }
  }
}

// ============================================================================
// ADIM 2: FF&E (DEMİRBAŞ & EKİPMAN) LOJİSTİK SERVER ACTIONS
// ============================================================================

export async function getRolloutFfeData(storeId?: string) {
  try {
    let items = [...INITIAL_FFE_ITEMS]

    // Prisma DB EquipmentLogistics tablosundan çek (ADIM 3 Entegrasyonu)
    try {
      const dbEquipments = await prisma.equipmentLogistics.findMany({
        where: storeId && storeId !== "ALL" ? { rolloutProjectId: storeId } : {},
        include: { rolloutProject: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      })

      if (dbEquipments && dbEquipments.length > 0) {
        const mappedDbItems: FfeItem[] = dbEquipments.map((e) => ({
          id: e.id,
          code: e.code || "FFE-ITEM",
          name: e.name,
          category: (e.category as any) || "Bar & Mutfak",
          quantity: e.quantity,
          unit: e.unit,
          supplier: e.supplier || "Merkez Tedarik Deposu",
          storeId: e.rolloutProjectId || "store-custom",
          storeName: e.rolloutProject?.name || "Franchise Şubesi",
          status: (e.status as any) || "Siparişi Bekleniyor",
          orderDate: e.orderDate ? e.orderDate.toISOString().split("T")[0] : "2026-11-01",
          etaDate: e.etaDate ? e.etaDate.toISOString().split("T")[0] : "2026-11-15",
          serialNo: e.serialNo || undefined,
          trackingInfo: (e.trackingInfo as any) || undefined,
        }))

        // DB kalemlerini öncelikli ekle
        items = [...mappedDbItems, ...items.filter((i) => !mappedDbItems.some((m) => m.id === i.id))]
      }
    } catch {
      // Offline fallback
    }

    if (storeId && storeId !== "ALL") {
      items = items.filter((i) => i.storeId === storeId)
    }

    // KPI Özetleri
    const totalCount = items.length
    const waitingOrderCount = items.filter((i) => i.status === "Siparişi Bekleniyor").length
    const onOrderCount = items.filter((i) => i.status === "Siparişte").length
    const inTransitCount = items.filter((i) => i.status === "Yolda").length
    const inWarehouseCount = items.filter((i) => i.status === "Depoda").length
    const installedCount = items.filter((i) => i.status === "Sahaya Kuruldu").length
    const completionRate = totalCount > 0 ? Math.round((installedCount / totalCount) * 100) : 0

    return {
      success: true,
      items,
      stats: {
        totalCount,
        waitingOrderCount,
        onOrderCount,
        inTransitCount,
        inWarehouseCount,
        installedCount,
        completionRate,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message, items: INITIAL_FFE_ITEMS }
  }
}

export async function updateFfeItemStatus(
  itemId: string,
  newStatus: "Siparişi Bekleniyor" | "Siparişte" | "Yolda" | "Depoda" | "Sahaya Kuruldu"
) {
  try {
    const item = INITIAL_FFE_ITEMS.find((i) => i.id === itemId)
    if (item) {
      item.status = newStatus
    }

    // Prisma DB güncellemesi
    try {
      await prisma.equipmentLogistics.updateMany({
        where: { id: itemId },
        data: { status: newStatus },
      })
    } catch {}

    // Eğer Yolda yapıldıysa ve takip bilgisi yoksa otomatik gerçekçi GPS telemetrisi bağla
    if (newStatus === "Yolda" && item && !item.trackingInfo) {
      item.trackingInfo = {
        carrierName: "Nexa Özel Lojistik Filosu",
        driverName: "Sefa Gündüz",
        driverPhone: "+90 530 441 8900",
        plateNumber: "34 NXA 77",
        currentCity: "İstanbul / Tuzla OSB",
        originCity: "Nexa Lojistik Üssü",
        destinationCity: item.storeName,
        currentLat: 40.864,
        currentLng: 29.358,
        speedKmH: 74,
        etaRemaining: "45 dakika",
        batteryLevel: 96,
        cargoTemp: "+22°C",
      }
    }

    revalidatePath("/franchise/rollout/ffe")
    return { success: true, item }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// ADIM 3: RESMİ İZİNLER & KRİTİK YOL (CPM) SERVER ACTIONS
// ============================================================================

export async function getRolloutLegalData(storeId?: string) {
  try {
    let permits = [...INITIAL_LEGAL_PERMITS]
    if (storeId && storeId !== "ALL") {
      permits = permits.filter((p) => p.storeId === storeId)
    }

    // Kritik Yol ve Gecikme Riski Analizi (CPM Delay Risk Calculation)
    const analyzedPermits = permits.map((permit) => {
      const conDate = new Date(permit.constructionFinishDate)
      const permitDate = new Date(permit.estimatedApprovalDate)
      const diffMs = permitDate.getTime() - conDate.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      const hasDelayRisk = diffDays > 0 && permit.isCriticalPath && permit.status !== "ONAYLANDI"

      return {
        ...permit,
        diffDays,
        hasDelayRisk,
        delayDays: hasDelayRisk ? diffDays : 0,
      }
    })

    const criticalBottlenecks = analyzedPermits.filter((p) => p.hasDelayRisk)
    const hasGlobalDelayRisk = criticalBottlenecks.length > 0
    const maxDelayDays = criticalBottlenecks.reduce((max, cur) => Math.max(max, cur.delayDays), 0)

    const approvedCount = analyzedPermits.filter((p) => p.status === "ONAYLANDI").length
    const totalCount = analyzedPermits.length
    const completionRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

    return {
      success: true,
      permits: analyzedPermits,
      cpmAnalysis: {
        hasGlobalDelayRisk,
        maxDelayDays,
        criticalBottlenecks,
        approvedCount,
        totalCount,
        completionRate,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message, permits: INITIAL_LEGAL_PERMITS }
  }
}

export async function updateLegalPermitStatus(
  permitId: string,
  data: {
    status?: "BAŞVURU_YAPILMADI" | "EVRAK_INCELEMESI" | "KESIF_BEKLENIYOR" | "ONAYLANDI" | "GECIKMEDE"
    estimatedApprovalDate?: string
    notes?: string
    documentUrl?: string
  }
) {
  try {
    const permit = INITIAL_LEGAL_PERMITS.find((p) => p.id === permitId)
    if (!permit) {
      return { success: false, error: "İzin kaydı bulunamadı." }
    }

    if (data.status) permit.status = data.status
    if (data.estimatedApprovalDate) permit.estimatedApprovalDate = data.estimatedApprovalDate
    if (data.notes) permit.notes = data.notes
    if (data.documentUrl) permit.documentUrl = data.documentUrl

    if (data.status === "ONAYLANDI") {
      permit.actualApprovalDate = new Date().toISOString().split("T")[0]
    }

    revalidatePath("/franchise/rollout/legal")
    return { success: true, permit }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// ADIM 4: PUNCH LIST & OTOMATİK DÖF (İŞ EMRİ) SERVER ACTIONS
// ============================================================================

export async function getRolloutPunchListData(storeId?: string) {
  try {
    let items = [...INITIAL_PUNCH_ITEMS]
    if (storeId && storeId !== "ALL") {
      items = items.filter((p) => p.storeId === storeId)
    }

    // Prisma DB senkronizasyonu dene
    try {
      const dbPunch = await prisma.punchList.findMany({
        where: storeId && storeId !== "ALL" ? { projectId: storeId } : {},
        include: { project: true },
        orderBy: { deadline: "asc" },
      })

      if (dbPunch && dbPunch.length > 0) {
        // Enriched DB punch list
      }
    } catch {
      // Offline fallback
    }

    const openCount = items.filter((i) => i.status === "OPEN").length
    const fixedCount = items.filter((i) => i.status === "FIXED").length
    const verifiedCount = items.filter((i) => i.status === "VERIFIED").length
    const totalCount = items.length
    const isPreOpeningBlocked = openCount + fixedCount > 0

    return {
      success: true,
      items,
      stats: {
        totalCount,
        openCount,
        fixedCount,
        verifiedCount,
        isPreOpeningBlocked,
        verificationRate: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message, items: INITIAL_PUNCH_ITEMS }
  }
}

/**
 * Sahadan Yeni Punch List (Kusur) Girişi ve Otomatik Taşeron DÖF (İş Emri) Tetiklemesi
 */
export async function createRolloutPunchListItem(data: {
  storeId: string
  subcontractorId: string
  subcontractorName: string
  defectDesc: string
  locationFloor: string
  photoUrl?: string
  priority?: "KRITIK" | "YUKSEK" | "NORMAL" | "DUSUK"
  deadline: string
}) {
  try {
    const store = INITIAL_STORES.find((s) => s.id === data.storeId)
    const storeName = store ? store.name : "Franchise Şubesi"

    const newPunchId = "punch-" + Date.now()
    const autoTaskId = "task-dof-" + Date.now()

    const newPunchItem: PunchListItemExt = {
      id: newPunchId,
      storeId: data.storeId,
      storeName,
      subcontractorId: data.subcontractorId,
      subcontractorName: data.subcontractorName,
      defectDesc: data.defectDesc,
      locationFloor: data.locationFloor || "Zemin Kat",
      photoUrl: data.photoUrl || null,
      priority: data.priority || "YUKSEK",
      status: "OPEN",
      deadline: data.deadline,
      createdAt: new Date().toISOString(),
      taskId: autoTaskId,
    }

    INITIAL_PUNCH_ITEMS.unshift(newPunchItem)

    // ============================================================================
    // ADIM 4: OTOMATİK DÖF (İŞ EMRİ) VE ÇAPRAZ TAŞERON BAĞLANTISI
    // ============================================================================
    try {
      const tenantId = await getFranchiseTenantId().catch(() => null)

      // 1. Prisma PunchList kaydı oluştur
      let dbPunch: any = null
      try {
        dbPunch = await prisma.punchList.create({
          data: {
            tenantId: tenantId || null,
            projectId: data.storeId,
            inspectorId: "Bölge Müdürü",
            subcontractorId: data.subcontractorId,
            defectDesc: data.defectDesc,
            photoUrl: data.photoUrl || null,
            deadline: new Date(data.deadline),
            status: "OPEN",
          },
        })
      } catch {}

      // 2. Taşeronun havuzuna otomatik DÖF (İş Emri) fırlat
      const createdTask = await prisma.task.create({
        data: {
          tenantId: tenantId || undefined,
          projectId: data.storeId,
          punchListId: dbPunch?.id || newPunchId,
          title: `[DÖF - Punch List] ${data.defectDesc.slice(0, 60)}...`,
          description: `MAHAL: ${data.locationFloor || "Genel"} | ŞUBE: ${storeName} | KUSUR: ${data.defectDesc}`,
          status: "TODO",
          taskType: "DÖF",
          assignedTo: data.subcontractorId,
          dueDate: new Date(data.deadline),
        },
      })

      if (dbPunch && createdTask) {
        await prisma.punchList.update({
          where: { id: dbPunch.id },
          data: { taskId: createdTask.id },
        })
      }
    } catch (err) {
      console.warn("Prisma punch list task sync fallback:", err)
    }

    revalidatePath("/franchise/rollout/punch-list")
    revalidatePath("/franchise/rollout/board")
    return {
      success: true,
      item: newPunchItem,
      message: "Kusur kaydı başarıyla oluşturuldu ve sorumlu taşerona otomatik DÖF (İş Emri) olarak atandı.",
    }
  } catch (error: any) {
    console.error("createRolloutPunchListItem error:", error)
    return { success: false, error: error.message || "Kusur kaydı oluşturulamadı" }
  }
}

/**
 * Punch List Durumunu Güncelle (OPEN -> FIXED -> VERIFIED)
 */
export async function updateRolloutPunchStatus(
  itemId: string,
  newStatus: "OPEN" | "FIXED" | "VERIFIED"
) {
  try {
    const item = INITIAL_PUNCH_ITEMS.find((i) => i.id === itemId)
    if (!item) {
      return { success: false, error: "Punch list kaydı bulunamadı." }
    }

    item.status = newStatus

    // Prisma DB PunchList güncellemesi
    try {
      await prisma.punchList.updateMany({
        where: { id: itemId },
        data: { status: newStatus },
      })
    } catch {}

    // Eğer bağlı Task varsa onu da senkronize et
    if (item.taskId) {
      try {
        const taskStatus = newStatus === "VERIFIED" ? "COMPLETED" : newStatus === "FIXED" ? "IN_REVIEW" : "TODO"
        await prisma.task.update({
          where: { id: item.taskId },
          data: { status: taskStatus },
        })
      } catch {
        // Offline mode
      }
    }

    revalidatePath("/franchise/rollout/punch-list")
    revalidatePath("/franchise/rollout/board")
    return { success: true, item }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

