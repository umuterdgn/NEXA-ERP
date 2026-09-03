/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { ShieldCheck, FileText, Plus, Trash2, Edit } from "lucide-react";

interface WorkerDocument {
  id: string;
  workerName: string;
  tcNo: string | null;
  sgkStatus: boolean;
  ohsTraining: boolean;
  medicalReport: boolean;
  notes: string | null;
  subcontractor: {
    id: string;
    name: string;
  };
}

interface Subcontractor {
  id: string;
  name: string;
}

interface DocumentsClientProps {
  initialDocuments: WorkerDocument[];
  subcontractors: Subcontractor[];
}

export default function DocumentsClient({ initialDocuments, subcontractors }: DocumentsClientProps) {
  const [documents, setDocuments] = useState<WorkerDocument[]>(initialDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<WorkerDocument | null>(null);
  const [formData, setFormData] = useState({
    subcontractorId: "",
    workerName: "",
    tcNo: "",
    sgkStatus: false,
    ohsTraining: false,
    medicalReport: false,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDocument 
        ? `/api/worker-documents/${editingDocument.id}`
        : '/api/worker-documents';
      
      const method = editingDocument ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedDocument = await response.json();
        if (editingDocument) {
          setDocuments(documents.map(doc => doc.id === editingDocument.id ? updatedDocument : doc));
        } else {
          setDocuments([updatedDocument, ...documents]);
        }
        setIsModalOpen(false);
        setEditingDocument(null);
        setFormData({
          subcontractorId: "",
          workerName: "",
          tcNo: "",
          sgkStatus: false,
          ohsTraining: false,
          medicalReport: false,
          notes: "",
        });
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/worker-documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== id));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleEdit = (doc: WorkerDocument) => {
    setEditingDocument(doc);
    setFormData({
      subcontractorId: doc.subcontractor.id,
      workerName: doc.workerName,
      tcNo: doc.tcNo || "",
      sgkStatus: doc.sgkStatus,
      ohsTraining: doc.ohsTraining,
      medicalReport: doc.medicalReport,
      notes: doc.notes || "",
    });
    setIsModalOpen(true);
  };

  const Badge = ({ status }: { status: boolean }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status 
        ? 'bg-green-900/30 text-green-400 border border-green-700' 
        : 'bg-red-900/30 text-red-400 border border-red-700'
    }`}>
      {status ? 'Tamam' : 'Eksik'}
    </span>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">👷 İSG ve Evrak Takibi</h1>
          <p className="text-slate-400">Taşeron çalışanlarının İSG eğitimleri, SGK kayıtları ve sağlık raporlarını takip edin.</p>
        </div>
        <button
          onClick={() => {
            setEditingDocument(null);
            setFormData({
              subcontractorId: "",
              workerName: "",
              tcNo: "",
              sgkStatus: false,
              ohsTraining: false,
              medicalReport: false,
              notes: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni İşçi/Evrak Ekle
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Taşeron Firma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">İşçi Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">TC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">SGK Girişi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">İSG Eğitimi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sağlık Raporu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Henüz kayıtlı işçi evrağı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{doc.subcontractor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{doc.workerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{doc.tcNo || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge status={doc.sgkStatus} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge status={doc.ohsTraining} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge status={doc.medicalReport} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(doc)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingDocument ? 'İşçi Evrağı Düzenle' : 'Yeni İşçi/Evrak Ekle'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Taşeron Firma *</label>
                <select
                  required
                  value={formData.subcontractorId}
                  onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Firma Seçin</option>
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşçi Adı *</label>
                <input
                  required
                  type="text"
                  value={formData.workerName}
                  onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="İşçi adını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">TC Kimlik No</label>
                <input
                  type="text"
                  value={formData.tcNo}
                  onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="11 haneli TC no"
                  maxLength={11}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sgkStatus}
                    onChange={(e) => setFormData({ ...formData, sgkStatus: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">SGK Girişi</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ohsTraining}
                    onChange={(e) => setFormData({ ...formData, ohsTraining: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">İSG Eğitimi</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.medicalReport}
                    onChange={(e) => setFormData({ ...formData, medicalReport: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">Sağlık Raporu</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  {editingDocument ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
