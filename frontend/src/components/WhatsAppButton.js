import React, { useState } from "react";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle, X, Send, Copy as CopyIcon, ExternalLink } from "lucide-react";

const fmtRp = (v) => `Rp ${Number(v||0).toLocaleString("id-ID")}`;

export default function WhatsAppButton({ nik, tahun, bulan, label = "Kirim WA", className = "" }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll/wa/${nik}`, { params: { tahun, bulan } });
      setPreview(data);
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  const copyMsg = async () => {
    try {
      await navigator.clipboard.writeText(preview.message);
      toast.success("Pesan disalin");
    } catch { toast.error("Gagal menyalin"); }
  };

  const sendWA = () => { window.open(preview.wa_link, "_blank"); };

  return (
    <>
      <button
        onClick={open}
        data-testid={`wa-btn-${nik}`}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-sm border border-emerald-600 text-emerald-700 hover:bg-emerald-50 ${className}`}
      >
        <MessageCircle size={13}/> {label}
      </button>
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={()=>setPreview(null)}>
          <div className="bg-white rounded-sm max-w-lg w-full" onClick={e=>e.stopPropagation()}>
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">Kirim Slip WhatsApp</div>
                <div className="heading text-lg font-semibold">{preview.nama}</div>
                <div className="text-xs text-gray-500 mt-0.5">THP: <span className="mono font-medium">{fmtRp(preview.take_home_pay)}</span></div>
              </div>
              <button onClick={()=>setPreview(null)} className="text-gray-500 hover:text-black"><X size={18}/></button>
            </div>
            <div className="p-4 space-y-3">
              {!preview.has_phone && (
                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-sm p-2">
                  Karyawan belum memiliki nomor HP. Anda tetap dapat menyalin pesan atau kirim manual — tambahkan nomor di Master Karyawan → No HP (WA).
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Pesan WhatsApp</div>
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-sm p-3 max-h-72 overflow-auto font-mono">{preview.message}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={sendWA} data-testid="wa-send" className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-sm text-sm hover:bg-emerald-700">
                  <Send size={14}/> Buka WhatsApp
                </button>
                <button onClick={copyMsg} data-testid="wa-copy" className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-sm text-sm hover:bg-gray-50">
                  <CopyIcon size={14}/> Salin Pesan
                </button>
                <a href={preview.pdf_url} target="_blank" rel="noreferrer" data-testid="wa-pdf" className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-sm text-sm hover:bg-gray-50">
                  <ExternalLink size={14}/> Lihat PDF
                </a>
              </div>
              <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                Klik "Buka WhatsApp" → aplikasi WhatsApp Web/App akan terbuka dengan pesan siap kirim. Link PDF di dalam pesan dapat diakses karyawan tanpa perlu login.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
