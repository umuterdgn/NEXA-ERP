/**
 * T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı
 * Devlet Sistemleri Entegrasyon Servisi (Simülasyon / Mock Engine)
 * 
 * Entegre Sistemler:
 * - UYDS: Ulusal Yapı Denetim Sistemi
 * - EBİS: Elektronik Beton İzleme Sistemi (Çipli Beton RFID)
 * - YAMBİS: Yapı Müteahhitliği Bilişim Sistemi
 * - MAKS: Mekânsal Adres Kayıt Sistemi
 */

export interface YibfProjectGovData {
  yibfNo: string;
  // MAKS Verileri
  maks: {
    il: string;
    ilce: string;
    mahalle: string;
    ada: string;
    parsel: string;
    pafta: string;
    uavtKodu: string;
    acikAdres: string;
    koordinatlar: {
      lat: number;
      lng: number;
    };
  };
  // YAMBİS Verileri (Müteahhit Bilgileri)
  yambis: {
    yambisNo: string;
    firmaAdi: string;
    vergiNo: string;
    yetkiBelgeGrup: string; // "A", "B", "C" Grubu Müteahhitlik Belgesi
    faaliyetDurumu: "AKTIF" | "ASKIDA" | "IPTAL";
    yetkiliKisi: string;
    sicilNo: string;
  };
  // UYDS Verileri (Bakanlık Ruhsat ve Yapı Denetim Bilgileri)
  uyds: {
    ruhsatNo: string;
    ruhsatTarihi: string;
    yapiSinifi: string; // Örn: "IV-A", "III-B"
    toplamInsaatAlani: number; // m2
    binaTabanAlani: number; // m2
    katAdedi: {
      bodrum: number;
      zemin: number;
      normal: number;
      toplam: number;
    };
    tasiyiciSistem: string; // "Betonarme Karkas", "Çelik", "Prefabrik"
    yapiSahibi: string;
    santiyeSefi: {
      adSoyad: string;
      odaSicilNo: string;
      tcKimlikNoMaskeli: string;
    };
    yapiDenetimKurulusu: {
      izinBelgeNo: string;
      unvan: string;
    };
    denetimGorevlileri: Array<{
      unvan: string;
      adSoyad: string;
      odaSicil: string;
    }>;
  };
  sistemSorguZamani: string;
  dogrulamaKodu: string;
}

export interface EbisCoreSampleGovData {
  ebisRfidTag: string;
  cipSeriNo: string;
  barkodNo: string;
  yibfNo: string;
  dokumTarihi: string;
  numuneAlmaSaati: string;
  betonSinifi: string; // Örn: "C30/37"
  tasarimDayanimiMpa: number; // Örn: 30.0
  irsaliyeNo: string;
  mikserPlaka: string;
  santralAdi: string;
  yapiElemani: string; // Örn: "3. Kat Kolon ve Perdeler", "Temel Radye"
  laboratuvar: {
    labAdi: string;
    izinBelgeNo: string;
    deneySorumlusu: string;
  };
  kirimSonuclari: {
    yediGunluk: {
      tarih: string;
      basincDayanimiMpa: number;
      hedefOranYuzde: number;
      durum: "UYGUN" | "RISKLI" | "UYGUNSUZ";
    };
    yirmisekizGunluk: {
      tarih: string;
      basincDayanimiMpa: number;
      karakteristikDayanimMpa: number;
      guvenlikKatsayisi: number;
      durum: "UYGUN" | "UYGUNSUZ";
    };
  };
  onayDurumu: "ONAYLANDI" | "KOSULLU_GECTI" | "RED" | "BEKLEMEDE";
  bakanlikKarekod: string;
  sorguTarihi: string;
}

/**
 * UYDS, MAKS ve YAMBİS sistemlerinden YİBF numarasına göre otonom veri çeker.
 */
export async function fetchYibfData(yibfNo: string): Promise<YibfProjectGovData> {
  const cleanYibf = yibfNo.trim();
  if (!cleanYibf) {
    throw new Error("Geçerli bir YİBF Numarası girilmelidir.");
  }

  // Simüle edilmiş Bakanlık Gateway gecikmesi (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  // YİBF numarasına göre deterministik ama zengin veri üretimi
  const hash = cleanYibf.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const ada = ((hash % 850) + 120).toString();
  const parsel = ((hash % 45) + 3).toString();
  const pafta = `G22-${((hash % 12) + 1).toString().padStart(2, "0")}-d`;
  const katSayisi = (hash % 10) + 4;
  const toplamAlan = ((hash % 12) + 2) * 1150 + 450;

  const firmalar = [
    { name: "Atlas İnşaat Taahhüt San. ve Tic. A.Ş.", vkn: "0840592817", yetki: "A" },
    { name: "Yıldız Mimarlık ve Yapı Denetim Hizmetleri Ltd.", vkn: "9283746152", yetki: "B" },
    { name: "Toroslar Konut ve Altyapı Yatırımları A.Ş.", vkn: "3491827401", yetki: "A" },
    { name: "Kuzey Doğu Proje Mühendislik Ltd. Şti.", vkn: "7162534890", yetki: "C" },
    { name: "Erdoğanlar Yapı Endüstri A.Ş.", vkn: "5182937402", yetki: "A" },
  ];
  const firma = firmalar[hash % firmalar.length];

  const semtler = [
    { il: "İstanbul", ilce: "Kadıköy", mahalle: "Fenerbahçe Mah.", lat: 40.9723, lng: 29.0432 },
    { il: "İstanbul", ilce: "Ümraniye", mahalle: "Finanskent Mah.", lat: 41.0185, lng: 29.1174 },
    { il: "Ankara", ilce: "Çankaya", mahalle: "Oran Mah.", lat: 39.8512, lng: 32.8421 },
    { il: "İzmir", ilce: "Bayraklı", mahalle: "Mansuroğlu Mah.", lat: 38.4623, lng: 27.1892 },
    { il: "Bursa", ilce: "Nilüfer", mahalle: "Odunluk Mah.", lat: 40.2034, lng: 28.9876 },
  ];
  const semt = semtler[hash % semtler.length];

  return {
    yibfNo: cleanYibf,
    maks: {
      il: semt.il,
      ilce: semt.ilce,
      mahalle: semt.mahalle,
      ada,
      parsel,
      pafta,
      uavtKodu: `UAVT-${(1000000000 + (hash % 90000000)).toString()}`,
      acikAdres: `${semt.mahalle} 1422. Sokak No: ${parsel}/${ada} ${semt.ilce} / ${semt.il}`,
      koordinatlar: {
        lat: semt.lat + ((hash % 100) - 50) * 0.0005,
        lng: semt.lng + ((hash % 100) - 50) * 0.0005,
      },
    },
    yambis: {
      yambisNo: `YMB-TR-${(hash % 90000 + 10000)}`,
      firmaAdi: firma.name,
      vergiNo: firma.vkn,
      yetkiBelgeGrup: `${firma.yetki} Grubu Müteahhitlik Yetki Belgesi`,
      faaliyetDurumu: "AKTIF",
      yetkiliKisi: "Müh. Ahmet Turan Yılmaz",
      sicilNo: `İTO-${hash % 80000 + 20000}`,
    },
    uyds: {
      ruhsatNo: `2026/${hash % 400 + 100}-R`,
      ruhsatTarihi: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      yapiSinifi: katSayisi > 7 ? "IV-A" : "III-B",
      toplamInsaatAlani: toplamAlan,
      binaTabanAlani: Math.round(toplamAlan / katSayisi),
      katAdedi: {
        bodrum: 2,
        zemin: 1,
        normal: katSayisi - 3,
        toplam: katSayisi,
      },
      tasiyiciSistem: "Betonarme Karkas (C30/37 - B420C Nervürlü Çelik)",
      yapiSahibi: "S.S. Güven Modern Yaşam Konut Yapı Kooperatifi",
      santiyeSefi: {
        adSoyad: "İnş. Müh. Burak Doğan",
        odaSicilNo: `İMO-${hash % 50000 + 60000}`,
        tcKimlikNoMaskeli: "294******18",
      },
      yapiDenetimKurulusu: {
        izinBelgeNo: "YDK-1048",
        unvan: "NEXA Akredite Yapı Denetim ve Mühendislik Hizmetleri A.Ş.",
      },
      denetimGorevlileri: [
        { unvan: "Proje ve Uygulama Denetçisi", adSoyad: "Müh. Selim Karaca", odaSicil: "İMO-41290" },
        { unvan: "Uygulama Denetçisi (Mimar)", adSoyad: "Mim. Elif Öztürk", odaSicil: "MO-19402" },
        { unvan: "Elektrik Denetçisi", adSoyad: "Müh. Caner Koç", odaSicil: "EMO-31094" },
        { unvan: "Makine Denetçisi", adSoyad: "Müh. Serhat Kaya", odaSicil: "MMO-28491" },
      ],
    },
    sistemSorguZamani: new Date().toISOString(),
    dogrulamaKodu: `GOV-YIBF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
  };
}

/**
 * EBİS (Elektronik Beton İzleme Sistemi) Çipli Beton RFID sorgusu ve kırım sonuçları
 */
export async function syncEbisCoreSample(ebisRfidTag: string): Promise<EbisCoreSampleGovData> {
  const cleanTag = ebisRfidTag.trim().toUpperCase();
  if (!cleanTag) {
    throw new Error("Geçerli bir EBİS RFID Etiket ID girilmelidir.");
  }

  // Simüle edilmiş laboratuvar sorgu gecikmesi (200ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  const hash = cleanTag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const yediGunMpa = Number((22.5 + (hash % 60) * 0.1).toFixed(2));
  const yirmiSekizGunMpa = Number((31.5 + (hash % 85) * 0.1).toFixed(2));
  const isPass = yirmiSekizGunMpa >= 30.0;

  return {
    ebisRfidTag: cleanTag,
    cipSeriNo: `RFID-EBIS-${(hash % 9000000 + 1000000)}`,
    barkodNo: `868000${(hash % 900000 + 100000)}`,
    yibfNo: `10${(hash % 90000 + 10000)}`,
    dokumTarihi: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    numuneAlmaSaati: "14:45",
    betonSinifi: "C30/37",
    tasarimDayanimiMpa: 30.0,
    irsaliyeNo: `IRS-${hash % 80000 + 20000}`,
    mikserPlaka: `34 NKA ${(hash % 900 + 100)}`,
    santralAdi: "Hazır Beton San. ve Tic. A.Ş. Tuzla Tesisi",
    yapiElemani: "4. Kat Kolon ve Perde İmalatı",
    laboratuvar: {
      labAdi: "T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Yetkili Merkez Yapı Laboratuvarı",
      izinBelgeNo: "LAB-TR-2041",
      deneySorumlusu: "Yük. Müh. Hakan Çetinkaya (Deney Yapan)",
    },
    kirimSonuclari: {
      yediGunluk: {
        tarih: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        basincDayanimiMpa: yediGunMpa,
        hedefOranYuzde: Number(((yediGunMpa / 30.0) * 100).toFixed(1)),
        durum: yediGunMpa >= 21.0 ? "UYGUN" : "RISKLI",
      },
      yirmisekizGunluk: {
        tarih: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        basincDayanimiMpa: yirmiSekizGunMpa,
        karakteristikDayanimMpa: 30.0,
        guvenlikKatsayisi: 1.5,
        durum: isPass ? "UYGUN" : "UYGUNSUZ",
      },
    },
    onayDurumu: isPass ? "ONAYLANDI" : "RED",
    bakanlikKarekod: `https://ebis.csb.gov.tr/dogrulama?tag=${encodeURIComponent(cleanTag)}`,
    sorguTarihi: new Date().toISOString(),
  };
}
