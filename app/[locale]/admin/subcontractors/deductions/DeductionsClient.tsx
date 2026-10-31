/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { TrendingDown, Plus, Trash2, Edit, DollarSign, AlertTriangle } from "lucide-react";

interface Deduction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  appliedToBillingId: string | null;
  notes: string | null;
  subcontractor: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
}

interface Subcontractor {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface DeductionsClientProps {
  initialDeductions: Deduction[];
  subcontractors: Subcontractor[];
  projects: Project[];
  monthlyTotal: number;
  topPenalizedSubcontractor: [string, number] | undefined;
}

export default function DeductionsClient({ 
  initialDeductions, 
  subcontractors, 
  projects,
  monthlyTotal,
  topPenalizedSubcontractor 
}: DeductionsClientProps) {
  const [deductions, setDeductions] = useState<Deduction[]>(initialDeductions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [formData, setFormData] = useState({
    subcontractorId: "",
    projectId: "",
    amount: "",
    reason: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDeduction 
        ? `/api/deductions/${editingDeduction.id}`
        : '/api/deductions';
      
      const method = editingDeduction ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        const updatedDeduction = await response.json();
        if (editingDeduction) {
          setDeductions(deductions.map(d => d.id === editingDeduction.id ? updatedDeduction : d));
        } else {
          setDeductions([updatedDeduction, ...deductions]);
        }
        setIsModalOpen(false);
        setEditingDeduction(null);
        setFormData({
          subcontractorId: "",
          projectId: "",
          amount: "",
          reason: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error('Error saving deduction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kesinti kaydını silmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/deductions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeductions(deductions.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Error deleting deduction:', error);
    }
  };

  const handleEdit = (deduction: Deduction) => {
    setEditingDeduction(deduction);
    setFormData({
      subcontractorId: deduction.subcontractor.id,
      projectId: deduction.project?.id || "",
      amount: deduction.amount.toString(),
      reason: deduction.reason,
      notes: deduction.notes || "",
    });
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">📉 Kesintiler ve Cezalar</h1>
          <p className="text-slate-400">Taşeron kesintilerini, cezaları ve hakediş uygulamalarını yönetin.</p>
        </div>
        <button
          onClick={() => {
            setEditingDeduction(null);
            setFormData({
              subcontractorId: "",
              projectId: "",
              amount: "",
              reason: "",
              notes: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ceza/Kesinti Uygula
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Bu Ayki Toplam Ceza Tutarı</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">En Çok Ceza Alan Taşeron</p>
              <p className="text-2xl font-bold text-white">
                {topPenalizedSubcontractor 
                  ? topPenalizedSubcontractor[0] 
                  : 'Veri yok'}
              </p>
              {topPenalizedSubcontractor && (
                <p className="text-sm text-slate-400">{formatCurrency(topPenalizedSubcontractor[1])}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Taşeron Firma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Proje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Kesinti Sebebi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Henüz kesinti/ceza kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                deductions.map((deduction) => (
                  <tr key={deduction.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{deduction.subcontractor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{deduction.project?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{deduction.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400">{formatCurrency(deduction.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatDate(deduction.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(deduction)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deduction.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingDeduction ? 'Kesinti Düzenle' : 'Yeni Ceza/Kesinti Uygula'}
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Firma Seçin</option>
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Proje Seçin (İsteğe Bağlı)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tutar (₺) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kesinti Sebebi *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Örn: Baret takmama, Kalıp hasarı vb."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  {editingDeduction ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
