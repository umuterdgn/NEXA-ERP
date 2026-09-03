/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { ShoppingCart, CheckCircle, XCircle, AlertTriangle, Package, Clock } from "lucide-react";

interface MaterialRequest {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  urgency: string;
  status: string;
  notes: string | null;
  createdAt: string;
  project: {
    name: string;
  };
  requester: {
    name: string;
    surname: string;
  };
  purchaseOrders: any[];
}

interface ProcurementClientProps {
  initialRequests: MaterialRequest[];
}

export default function ProcurementClient({ initialRequests }: ProcurementClientProps) {
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    unitPrice: "",
  });

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          supplierName: formData.supplierName,
          unitPrice: parseFloat(formData.unitPrice),
          totalPrice: parseFloat(formData.unitPrice) * selectedRequest.quantity,
        }),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setRequests(requests.map(req => req.id === selectedRequest.id ? updatedRequest : req));
        setIsModalOpen(false);
        setSelectedRequest(null);
        setFormData({ supplierName: "", unitPrice: "" });
      }
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Bu talebi reddetmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/material-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (response.ok) {
        setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'REJECTED' } : req));
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-900/30 text-yellow-400 border-yellow-700', label: 'Bekliyor' },
      QUOTING: { color: 'bg-blue-900/30 text-blue-400 border-blue-700', label: 'Teklif Alınıyor' },
      APPROVED: { color: 'bg-green-900/30 text-green-400 border-green-700', label: 'Onaylandı' },
      REJECTED: { color: 'bg-red-900/30 text-red-400 border-red-700', label: 'Reddedildi' },
      DELIVERED: { color: 'bg-purple-900/30 text-purple-400 border-purple-700', label: 'Teslim Edildi' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: { color: 'bg-slate-900/30 text-slate-400 border-slate-700', label: 'Düşük' },
      NORMAL: { color: 'bg-blue-900/30 text-blue-400 border-blue-700', label: 'Normal' },
      HIGH: { color: 'bg-orange-900/30 text-orange-400 border-orange-700', label: 'Yüksek' },
      CRITICAL: { color: 'bg-red-900/30 text-red-400 border-red-700', label: 'Kritik' },
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.NORMAL;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getUrgencyRowClass = (urgency: string) => {
    if (urgency === 'CRITICAL') return 'bg-red-900/10 border-l-4 border-l-red-500';
    if (urgency === 'HIGH') return 'bg-orange-900/10 border-l-4 border-l-orange-500';
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">🛒 Satınalma Yönetimi</h1>
        <p className="text-slate-400">Sahadan gelen malzeme taleplerini inceleyin ve onaylayın.</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Aciliyet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Proje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Talep Eden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Malzeme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Miktar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Henüz talep bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-slate-800/50 transition-colors ${getUrgencyRowClass(request.urgency)}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{getUrgencyBadge(request.urgency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{request.project.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {request.requester.name} {request.requester.surname}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{request.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {request.quantity} {request.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatDate(request.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Teklif Gir / Onayla"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Reddet"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {request.purchaseOrders.length > 0 && (
                          <span className="text-xs text-green-400">
                            {formatCurrency(request.purchaseOrders[0].totalPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Teklif Gir / Onayla</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Talep Detayları</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Malzeme:</span>
                  <p className="text-white">{selectedRequest.itemName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Miktar:</span>
                  <p className="text-white">{selectedRequest.quantity} {selectedRequest.unit}</p>
                </div>
                <div>
                  <span className="text-slate-400">Proje:</span>
                  <p className="text-white">{selectedRequest.project.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Talep Eden:</span>
                  <p className="text-white">{selectedRequest.requester.name} {selectedRequest.requester.surname}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tedarikçi Adı *</label>
                <input
                  required
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Örn: Ekinciler Demir Çelik"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Birim Fiyat (₺) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {formData.unitPrice && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Toplam Tutar:</span>
                    <span className="text-lg font-bold text-green-400">
                      {formatCurrency(parseFloat(formData.unitPrice) * selectedRequest.quantity)}
                    </span>
                  </div>
                </div>
              )}

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
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'İşleniyor...' : 'Onayla ve Sipariş Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
