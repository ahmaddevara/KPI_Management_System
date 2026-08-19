import React, { useEffect, useState } from "react";
import api, { formatErr, MONTHS } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ClipboardList, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const now = new Date();

export default function Approval() {
  const { user } = useAuth();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth()+1);
  const [rows, setRows] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [divisi, setDivisi] = useState("");

  const load = async () => {
    const p = { tahun, bulan };
    if (divisi) p.divisi = divisi;
    const { data } = await api.get("/kpi-input", { params: p });
    setRows(data.filter(r => (r.status||"approved") !== "approved" || true));
  };
  useEffect(() => {
    api.get("/divisi").then(r=>setDivisiList(r.data));
    load();
    // eslint-disable-next-line
  }, [tahun, bulan, divisi]);

  const action = async (act) => {
    try {
      const body = { tahun, bulan, action: act };
      if (divisi) body.divisi = divisi;
      const { data } = await api.post("/kpi-input/approve", body);
      toast.success(`${data.updated} data ${act === "approve" ? "disetujui" : "ditolak"}`);
      load();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };
  const submit = async () => {
    try {
      const body = { tahun, bulan };
      if (divisi) body.divisi = divisi;
      const { data } = await api.post("/kpi-input/submit", body);
      toast.success(`${data.submitted} data disubmit ke Admin`);
      load();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };

  const submitted = rows.filter(r => r.status === "submitted");
  const draft = rows.filter(r => (r.status||"draft") === "draft");
  const approved = rows.filter(r => (r.status||"approved") === "approved");
  const rejected = rows.filter(r => r.status === "rejected");

  const Pill = ({ s }) => {
    const m = {approved:"pill-ok", submitted:"pill-warn", draft:"pill-neutral", rejected:"pill-danger"};
    return <span className={`pill ${m[s||"approved"]}`}>{s || "approved"}</span>;
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Alur Kerja</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Persetujuan KPI</h1>
          <p className="text-sm text-gray-600">Review dan setujui data KPI yang disubmit Supervisor sebelum masuk ke Rekap.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={divisi} onChange={e=>setDivisi(e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="approval-divisi">
            <option value="">Semua Divisi</option>
            {divisiList.map(d=><option key={d.id} value={d.nama}>{d.nama}</option>)}
          </select>
          <select value={bulan} onChange={e=>setBulan(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="approval-bulan">
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="approval-tahun">
            {[tahun-1, tahun, tahun+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {label:"Draft", value: draft.length, tone:"pill-neutral"},
          {label:"Submitted", value: submitted.length, tone:"pill-warn"},
          {label:"Approved", value: approved.length, tone:"pill-ok"},
          {label:"Rejected", value: rejected.length, tone:"pill-danger"},
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">{c.label}</div>
            <div className="heading text-2xl font-semibold mt-1 mono">{c.value}</div>
            <span className={`pill ${c.tone} mt-2`}>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {user?.role === "supervisor" && (
          <button data-testid="approval-submit" onClick={submit} className="flex items-center gap-2 bg-[#111827] text-white px-3 py-2 rounded-sm text-sm">
            <Send size={14}/> Submit ke Admin ({draft.length})
          </button>
        )}
        {user?.role === "admin" && (
          <>
            <button data-testid="approval-approve" onClick={()=>action("approve")} disabled={!submitted.length} className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-sm text-sm disabled:opacity-50">
              <CheckCircle2 size={14}/> Setujui ({submitted.length})
            </button>
            <button data-testid="approval-reject" onClick={()=>action("reject")} disabled={!submitted.length} className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-sm text-sm disabled:opacity-50">
              <XCircle size={14}/> Tolak ({submitted.length})
            </button>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead><tr><th>NIK</th><th>Nama</th><th>Divisi</th><th>KPI</th><th className="text-right">Realisasi</th><th className="text-right">Achievement</th><th className="text-right">Nilai</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td className="mono">{r.nik}</td>
                <td>{r.nama}</td>
                <td>{r.divisi}</td>
                <td>{r.nama_kpi}</td>
                <td className="text-right mono">{Number(r.realisasi).toFixed(2)}</td>
                <td className="text-right mono">{(r.achievement*100).toFixed(2)}%</td>
                <td className="text-right mono">{r.nilai.toFixed(2)}</td>
                <td><Pill s={r.status}/></td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan="8" className="text-center py-6 text-gray-400"><ClipboardList size={16} className="inline mr-1"/>Tidak ada data untuk periode ini</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
