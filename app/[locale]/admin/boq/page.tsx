import { useTranslations } from 'next-intl';

export default function BoQPage() {
  // İleride i18n çevirisi eklenebilir, şimdilik statik başlık
  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Keşif & Metraj (BoQ)</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          + Yeni Keşif Ekle
        </button>
      </div>
      <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-900/50 border border-gray-800 rounded-xl">
         <p className="text-gray-400">Metraj ve keşif tabloları (BoQ) burada listelenecektir.</p>
      </div>
    </div>
  );
}
