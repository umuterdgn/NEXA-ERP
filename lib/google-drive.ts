/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// .env dosyasını fiziksel olarak okuyup kimlik bilgilerini döndüren yardımcı fonksiyon
function getGoogleCredentials() {
  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // Eğer process.env boş dönüyorsa diskten zorla oku
  if (!clientId || !clientSecret || !refreshToken) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log("--- FİZİKSEL ENV OKUMA RAPORU ---");
        console.log("Dosya Toplam Karakter Sayısı:", content.length);
        
        const foundKeys: string[] = [];
        content.split('\n').forEach((line, index) => {
          // Satır sonu karakterlerini (\r) temizle
          const cleanLine = line.replace(/\r/g, '').trim();
          if (!cleanLine || cleanLine.startsWith('#')) return; // Boş veya yorum satırlarını atla

          const match = cleanLine.match(/^([\w.-]+)\s*=\s*(.*)$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            value = value.replace(/(^['"]|['"]$)/g, '').trim();
            foundKeys.push(key);
            
            if (key === 'GOOGLE_CLIENT_ID') clientId = value;
            if (key === 'GOOGLE_CLIENT_SECRET') clientSecret = value;
            if (key === 'GOOGLE_REFRESH_TOKEN') refreshToken = value;
          }
        });
        console.log("Okunabilen Değişken İsimleri:", foundKeys);
        console.log("Eşleşme Durumu -> ID:", !!clientId, "Secret:", !!clientSecret, "Token:", !!refreshToken);
      }
    } catch (error) {
      console.error("Env okuma hatası:", error);
    }
  }

  return { clientId, clientSecret, refreshToken };
}

export const getDriveClient = () => {
  const { clientId, clientSecret, refreshToken } = getGoogleCredentials();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("KRITIK HATA: OAuth2 kimlik bilgileri dosyadan okunamadı!");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
};

export async function uploadPDFToDrive(fileBuffer: Buffer, fileName: string): Promise<string> {
  const drive = await getDriveClient();
  
  // Folder ID'yi de aynı şekilde diskten oku
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            value = value.replace(/(^['"]|['"]$)/g, '').trim();
            
            if (key === 'GOOGLE_DRIVE_FOLDER_ID') folderId = value;
          }
        });
      }
    } catch (error) {
      console.error("Folder ID okuma hatası:", error);
    }
  }

  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID bulunamadı");

  const stream = Readable.from(fileBuffer);
  
  const response = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: 'application/pdf', body: stream },
    fields: 'id, webViewLink'
  });

  if (response.data.id) {
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
  }

  return response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`;
}

export async function deleteFileFromDrive(fileId: string) {
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId: fileId });
    return true;
  } catch (error) {
    console.error("Drive'dan dosya silinirken hata:", error);
    return false;
  }
}
