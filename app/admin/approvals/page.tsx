/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma";
import { approveLeave, rejectLeave, approveAdvance, rejectAdvance } from "./actions";
import { Calendar, User, DollarSign, Check, X } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
  // Fetch pending leave requests
  let pendingLeaves: any[] = [];
  try {
    pendingLeaves = await prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { personel: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch pending leaves:", error);
  }

  // Fetch pending advance payments
  let pendingAdvances: any[] = [];
  try {
    pendingAdvances = await prisma.personelPayment.findMany({
      where: { status: "PENDING" },
      include: { personel: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch pending advances:", error);
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Onay Bekleyenler</h1>
        <p className="text-slate-400">Personel izin ve avans taleplerini yönetin</p>
      </div>

      {/* Leave Requests Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          İzin Talepleri ({pendingLeaves.length})
        </h2>

        {pendingLeaves.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Bekleyen izin talebi yok</p>
        ) : (
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Personel</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">İzin Türü</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Başlangıç</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Bitiş</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Gün</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Sebep</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{leave.personel.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{leave.personel.position || ""}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{leave.type}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(leave.startDate).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(leave.endDate).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{leave.days} gün</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {leave.reason || "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <form action={async (formData) => { await approveLeave(formData); }}>
                          <input type="hidden" name="id" value={leave.id} />
                          <button
                            type="submit"
                            className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                            title="Onayla"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </form>
                        <form action={async (formData) => { await rejectLeave(formData); }}>
                          <input type="hidden" name="id" value={leave.id} />
                          <button
                            type="submit"
                            className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                            title="Reddet"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advance Payments Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Avans Talepleri ({pendingAdvances.length})
        </h2>

        {pendingAdvances.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Bekleyen avans talebi yok</p>
        ) : (
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Personel</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Tür</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Tutar</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Dönem</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Açıklama</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdvances.map((advance) => (
                  <tr key={advance.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{advance.personel.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{advance.personel.position || ""}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{advance.type}</td>
                    <td className="py-3 px-4 text-green-400 font-medium">
                      ₺{advance.amount.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{advance.period || "-"}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {advance.description || "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <form action={async (formData) => { await approveAdvance(formData); }}>
                          <input type="hidden" name="id" value={advance.id} />
                          <button
                            type="submit"
                            className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                            title="Onayla"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </form>
                        <form action={async (formData) => { await rejectAdvance(formData); }}>
                          <input type="hidden" name="id" value={advance.id} />
                          <button
                            type="submit"
                            className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                            title="Reddet"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
