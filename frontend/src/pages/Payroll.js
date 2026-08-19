import React, { useEffect, useState } from "react";
import api, { formatErr, MONTHS } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Copy, ChevronRight, RefreshCw, MessageCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const now = new Date();
const fmtRp = (v) => `Rp ${Number(v||0).toLocaleString("id-ID")}`;

export default function Payroll() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth()+1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payroll", { params: { tahun, bulan }});
      setRows(data);
    } catch(e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tahun, bulan]);

  const totalTHP = rows.reduce((a,b)=> a + (b.take_home_pay||0), 0);

  const copyPrev = async () => {
    try {
      const { data } = await api.post("/payroll/copy-previous", { tahun, bulan });
      toast.success(`Disalin ${data.copied} entri dari bulan sebelumnya`);
      load();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };

  const dlRekap = async (fmt) => {
    const res = await api.get("/payroll/export/rekap", { params: { tahun, bulan, fmt }, responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url; a.download = `payroll_${tahun}_${bulan}.${fmt==="pdf"?"pdf":"xlsx"}`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Payroll</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Rekap Payroll Karyawan</h1>
          <p className="text-sm text-gray-600">{MONTHS[bulan-1]} {tahun} — Total THP: <span className="mono font-semibold text-[#111827]">{fmtRp(totalTHP)}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <select value={bulan} onChange={e=>setBulan(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="payroll-bulan">
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="payroll-tahun">
            {[tahun-1, tahun, tahun+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={copyPrev} data-testid="payroll-copy-prev" className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-sm text-sm hover:bg-gray-50"><Copy size={14}/> Copy Bulan Lalu</button>
          <button onClick={()=>dlRekap("excel")} data-testid="payroll-export-excel" className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-sm text-sm hover:bg-gray-50"><Download size={14}/> Excel</button>
          <button onClick={()=>dlRekap("pdf")} data-testid="payroll-export-pdf" className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-sm text-sm hover:bg-gray-50"><FileText size={14}/> PDF</button>
          <button onClick={load} data-testid="payroll-refresh" className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-sm text-sm hover:bg-gray-50"><RefreshCw size={14}/></button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead>
            <tr>
              <th>#</th><th>Karyawan</th><th>Jabatan</th><th>Sistem</th>
              <th className="text-right">Gaji Kotor</th>
              <th className="text-right">Lembur</th>
              <th className="text-right">Potongan</th>
              <th className="text-right">Take Home Pay</th>
              <th>Bank</th><th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="10" className="text-center py-6 text-gray-400">Memuat...</td></tr>}
            {!loading && rows.map((r,i) => (
              <tr key={r.nik} data-testid={`payroll-row-${r.nik}`}>
                <td className="mono">{i+1}</td>
                <td>
                  <div className="font-medium">{r.nama}</div>
                  <div className="text-[10px] text-gray-500 mono">{r.nik}</div>
                </td>
                <td>{r.jabatan}</td>
                <td><span className="pill pill-neutral">{r.sistem_kerja}</span></td>
                <td className="text-right mono">{fmtRp(r.total_gaji_kotor)}</td>
                <td className="text-right mono text-emerald-700">+{fmtRp(r.total_lembur_lainnya)}</td>
                <td className="text-right mono text-red-600">-{fmtRp(r.total_potongan)}</td>
                <td className="text-right mono font-semibold">{fmtRp(r.take_home_pay)}</td>
                <td className="text-[11px]">{r.bank}<div className="text-gray-500 mono text-[10px]">{r.no_rek}</div></td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2 justify-end">
                    <WhatsAppButton nik={r.nik} tahun={tahun} bulan={bulan} label="WA"/>
                    <button
                      data-testid={`payroll-detail-${r.nik}`}
                      onClick={()=>nav(`/payroll/${r.nik}?tahun=${tahun}&bulan=${bulan}`)}
                      className="text-[#0052FF] text-sm hover:underline inline-flex items-center gap-1">
                      Detail <ChevronRight size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length===0 && <tr><td colSpan="10" className="text-center text-gray-400 py-6">Belum ada karyawan</td></tr>}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="7" className="text-right">TOTAL PENGELUARAN GAJI</td>
                <td className="text-right mono">{fmtRp(totalTHP)}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
