import React, { useState } from "react";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { Upload, RefreshCw } from "lucide-react";

export default function ImportExcel() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState(null);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/import/excel", fd, { headers: {"Content-Type": "multipart/form-data"} });
      setStats(data.stats);
      toast.success("Import berhasil");
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  const reimportTemplate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/import/template");
      setStats(data.stats);
      toast.success("Template AP Group diimpor ulang");
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Admin</div>
        <h1 className="heading text-3xl font-semibold tracking-tight">Import Excel</h1>
        <p className="text-sm text-gray-600">Impor data dari file KPI Management System AP Group (.xlsm / .xlsx).</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Pilih File</label>
          <input data-testid="import-file" type="file" accept=".xlsx,.xlsm" onChange={e=>setFile(e.target.files[0])} className="text-sm"/>
        </div>
        <div className="flex gap-2">
          <button data-testid="import-upload" onClick={upload} disabled={!file || busy} className="flex items-center gap-2 bg-[#0052FF] text-white px-3 py-2 rounded-sm text-sm hover:bg-blue-700 disabled:opacity-50">
            <Upload size={14}/> {busy ? "Memproses..." : "Upload & Import"}
          </button>
          <button data-testid="import-reset" onClick={reimportTemplate} disabled={busy} className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-sm text-sm hover:bg-gray-50">
            <RefreshCw size={14}/> Impor Ulang Template AP Group
          </button>
        </div>

        {stats && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="text-sm font-semibold mb-2 heading">Hasil Import</div>
            <table className="data-table w-full">
              <thead><tr><th>Kolom</th><th className="text-right">Jumlah</th></tr></thead>
              <tbody>
                {Object.entries(stats).map(([k,v])=>(<tr key={k}><td>{k}</td><td className="text-right mono">{v}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
