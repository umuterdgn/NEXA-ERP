/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const deleteFromCloudinary = async (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return;
  try {
    // URL'den public_id'yi çıkar (Örn: nexa_erp/model_12345)
    const urlParts = url.split('/');
    const filenameWithExt = urlParts.pop();
    const folder = urlParts.pop();
    const publicId = `${folder}/${filenameWithExt?.split('.')[0]}`;
    
    // Yüklerken hepsine resource_type: 'image' demiştik, silerken de öyle yapmalıyız
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    console.log(`✅ Cloudinary'den silindi: ${publicId}`);
  } catch (error) {
    console.error("Cloudinary Silme Hatası:", error);
  }
};

export const deleteMultipleFromCloudinary = async (urls: string[]) => {
  if (!urls || urls.length === 0) return;
  
  const deletePromises = urls.map(url => deleteFromCloudinary(url));
  await Promise.allSettled(deletePromises);
};
