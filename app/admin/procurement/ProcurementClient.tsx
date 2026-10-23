/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Clock,
  Gavel,
  FileSpreadsheet,
  ArrowRight,
  Plus,
  RefreshCw,
  Building2,
  DollarSign,
  TrendingDown,
  Truck,
  FileText,
} from "lucide-react";

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

interface PurchaseRequestItem {
  id: string;
  projectId: string;
  materialName: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  project?: {
    title: string;
    name?: string;
  };
  bids?: any[];
}

interface ProcurementClientProps {
  initialRequests: MaterialRequest[];
}

export default function ProcurementClient({ initialRequests }: ProcurementClientProps) {
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "BIDDING">("BIDDING");
  const [requests, setRequests] = useState<MaterialRequest[]>(initialRequests);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewBiddingModalOpen, setIsNewBiddingModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  // New bidding form
  const [newBiddingData, setNewBiddingData] = useState({
    projectId: "",
    materialName: "",
    quantity: "",
    unit: "Ton",
  });

  const [formData, setFormData] = useState({
    supplierName: "",
    unitPrice: "",
  });

  useEffect(() => {
    fetchPurchaseRequests();
    fetchProjectsList();
  }, []);

  const fetchPurchaseRequests = async () => {
    try {
      const res = await fetch("/api/procurement/purchase-requests");
      if (res.ok) {
        const data = await res.json();
        setPurchaseRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          setNewBiddingData((prev) => ({ ...prev, projectId: data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBiddingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBiddingData.projectId || !newBiddingData.materialName || !newBiddingData.quantity) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      const res = await fetch("/api/procurement/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBiddingData),
      });

      if (res.ok) {
        setIsNewBiddingModalOpen(false);
        setNewBiddingData({
          projectId: projects[0]?.id || "",
          materialName: "",
          quantity: "",
          unit: "Ton",
        });
        await fetchPurchaseRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🛒 Satınalma & Tedarikçi İhale Portalı
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Şantiye malzeme taleplerini yönetin, ihaleler açın ve gelen tedarikçi tekliflerini mukayese edin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/procurement/logistics"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Truck className="w-4 h-4 text-blue-400" />
            Kapı Güvenlik & Lojistik
          </Link>
          <Link
            href="/admin/procurement/receipts/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/80 hover:border-emerald-600 text-emerald-300 text-xs font-bold transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Ambar Mal Kabul Formu
          </Link>
          <button
            onClick={() => setIsNewBiddingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-950"
          >
            <Plus className="w-4 h-4" />
            Yeni İhale / Talep Aç
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("BIDDING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "BIDDING"
              ? "bg-blue-600 text-white shadow-md shadow-blue-950"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Gavel className="w-4 h-4" />
          Açık İhaleler & Teklif Mukayesesi ({purchaseRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "REQUESTS"
              ? "bg-blue-600 text-white shadow-md shadow-blue-950"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          Saha Malzeme Talepleri ({requests.length})
        </button>
      </div>

      {/* Bidding Matrix Tab */}
      {activeTab === "BIDDING" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchaseRequests.map((pr) => {
              const bidsCount = pr.bids?.length || 0;
              const lowestBid = bidsCount > 0 ? pr.bids![0] : null;

              return (
                <div
                  key={pr.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                        {pr.project?.title || pr.project?.name || "Şantiye"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(pr.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{pr.materialName}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Talep Miktarı:{" "}
                        <strong className="text-amber-400 font-bold">
                          {pr.quantity} {pr.unit}
                        </strong>
                      </p>
                    </div>

                    {/* Lowest Bid Highlight */}
                    {lowestBid ? (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                            En Uygun Teklif:
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {lowestBid.supplier?.name || "Tedarikçi"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-400 font-mono">
                            {formatCurrency(lowestBid.unitPrice)} / {pr.unit}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                        Henüz tedarikçi teklifi verilmedi
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {bidsCount} Teklif Verildi
                    </span>
                    <Link
                      href={`/admin/procurement/bids/${pr.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Mukayese Tablosu
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Requests Table */
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
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
      )}

      {/* New Bidding Modal */}
      {isNewBiddingModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-blue-500" />
                Yeni Satınalma İhalesi Aç
              </h2>
              <button
                onClick={() => setIsNewBiddingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBiddingRequest} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  İlgili Şantiye Projesi *
                </label>
                <select
                  value={newBiddingData.projectId}
                  onChange={(e) =>
                    setNewBiddingData({ ...newBiddingData, projectId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Malzeme Adı / Şartnamesi *
                </label>
                <input
                  type="text"
                  placeholder="Örn: B420C Nervürlü İnşaat Demiri Q16-Q32"
                  value={newBiddingData.materialName}
                  onChange={(e) =>
                    setNewBiddingData({ ...newBiddingData, materialName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Miktar *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={newBiddingData.quantity}
                    onChange={(e) =>
                      setNewBiddingData({ ...newBiddingData, quantity: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Birim *</label>
                  <select
                    value={newBiddingData.unit}
                    onChange={(e) =>
                      setNewBiddingData({ ...newBiddingData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ton">Ton</option>
                    <option value="m³">m³</option>
                    <option value="Adet">Adet</option>
                    <option value="kg">kg</option>
                    <option value="m²">m²</option>
                    <option value="Torba">Torba</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewBiddingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-950"
                >
                  İhaleyi Başlat & Tedarikçilere Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
