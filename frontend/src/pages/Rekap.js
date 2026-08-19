import React, { useEffect, useState } from "react";
import api, { MONTHS } from "@/lib/api";
import { Download, FileText } from "lucide-react";

const now = new Date();

function ExportButtons({ jenis, tahun, bulan }) {
  const dl = async (fmt) => {
    const res = await api.get(`/export/${fmt}`, { params: {jenis, tahun, bulan}, responseType: "blob" });
    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rekap_${jenis}_${tahun}_${bulan||"tahunan"}.${fmt==="pdf"?"pdf":"xlsx"}`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  return (
    <div className="flex items-center gap-2">
      <button data-testid={`export-excel-${jenis}`} onClick={()=>dl("excel")} className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-sm text-sm hover:bg-gray-50"><Download size={14}/> Excel</button>
      <button data-testid={`export-pdf-${jenis}`} onClick={()=>dl("pdf")} className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-sm text-sm hover:bg-gray-50"><FileText size={14}/> PDF</button>
    </div>
  );
}

function Selector({ tahun, setTahun, bulan, setBulan, withBulan=true }) {
  return (
    <div className="flex items-center gap-2">
      {withBulan && <select data-testid="rekap-bulan" value={bulan||""} onChange={e=>setBulan(e.target.value?+e.target.value:null)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
        <option value="">Semua Bulan</option>
        {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
      </select>}
      <select data-testid="rekap-tahun" value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
        {[tahun-1, tahun, tahun+1].map(y=><option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function GradePill({ g }) {
  const map = { A:"pill-ok", B:"pill-ok", C:"pill-warn", D:"pill-warn", E:"pill-danger"};
  return <span className={`pill ${map[g]||"pill-neutral"}`}>Grade {g}</span>;
}

export function RekapIndividu() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth()+1);
  const [rows, setRows] = useState([]);
  useEffect(()=>{
    const params = { tahun }; if (bulan) params.bulan = bulan;
    api.get("/rekap/individu", { params }).then(r=>setRows(r.data));
  }, [tahun, bulan]);
  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Laporan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Rekap Individu</h1>
        </div>
        <div className="flex items-center gap-3">
          <Selector tahun={tahun} setTahun={setTahun} bulan={bulan} setBulan={setBulan}/>
          <ExportButtons jenis="individu" tahun={tahun} bulan={bulan}/>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead><tr><th>#</th><th>NIK</th><th>Nama</th><th>Divisi</th><th>Jabatan</th><th className="text-right">Total Nilai</th><th className="text-right">Score</th><th>Grade</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.nik}>
                <td className="mono">{i+1}</td>
                <td className="mono">{r.nik}</td>
                <td className="font-medium">{r.nama}</td>
                <td>{r.divisi}</td>
                <td>{r.jabatan}</td>
                <td className="text-right mono">{r.total_nilai.toFixed(2)}</td>
                <td className="text-right mono">{(r.score*100).toFixed(2)}%</td>
                <td><GradePill g={r.grade}/></td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan="8" className="text-center text-gray-400 py-6">Belum ada data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RekapDivisi() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth()+1);
  const [rows, setRows] = useState([]);
  useEffect(()=>{
    const params = { tahun }; if (bulan) params.bulan = bulan;
    api.get("/rekap/divisi", { params }).then(r=>setRows(r.data));
  }, [tahun, bulan]);
  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Laporan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Rekap Divisi</h1>
        </div>
        <div className="flex items-center gap-3">
          <Selector tahun={tahun} setTahun={setTahun} bulan={bulan} setBulan={setBulan}/>
          <ExportButtons jenis="divisi" tahun={tahun} bulan={bulan}/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(r => {
          const pct = (r.score*100).toFixed(2);
          const target = (r.target*100).toFixed(0);
          const ok = r.score >= r.target;
          return (
            <div key={r.divisi} className="bg-white border border-gray-200 rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="heading text-lg font-semibold">{r.divisi}</div>
                <GradePill g={r.grade}/>
              </div>
              <div className="text-3xl heading font-semibold mono">{pct}%</div>
              <div className="text-xs text-gray-500 mb-2">Target {target}%</div>
              <div className="bar-track"><div className={`bar-fill ${ok?"ok":"danger"}`} style={{width:`${Math.min(100,+pct)}%`}}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RekapPerusahaan() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  useEffect(()=>{ api.get("/rekap/perusahaan", { params:{tahun}}).then(r=>setData(r.data)); }, [tahun]);
  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Laporan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Rekap Perusahaan</h1>
        </div>
        <div className="flex items-center gap-3">
          <Selector tahun={tahun} setTahun={setTahun} bulan={null} setBulan={()=>{}} withBulan={false}/>
          <ExportButtons jenis="perusahaan" tahun={tahun} bulan={null}/>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead><tr><th>Bulan</th><th className="text-right">Aktual</th><th className="text-right">Target</th><th>Gap</th></tr></thead>
          <tbody>
            {data?.trend.map((t,i)=>{
              const gap = (t.score - t.target)*100;
              return (
                <tr key={i}>
                  <td>{MONTHS[t.bulan-1]}</td>
                  <td className="text-right mono">{(t.score*100).toFixed(2)}%</td>
                  <td className="text-right mono">{(t.target*100).toFixed(2)}%</td>
                  <td><span className={`pill ${gap>=0?"pill-ok":"pill-danger"}`}>{gap>=0?"+":""}{gap.toFixed(2)}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RewardPunishment() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth()+1);
  const [rows, setRows] = useState([]);
  useEffect(()=>{
    const p = {tahun}; if(bulan) p.bulan = bulan;
    api.get("/reward-punishment", { params: p }).then(r=>setRows(r.data));
  }, [tahun, bulan]);
  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Laporan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Reward & Punishment</h1>
        </div>
        <div className="flex items-center gap-3">
          <Selector tahun={tahun} setTahun={setTahun} bulan={bulan} setBulan={setBulan}/>
          <ExportButtons jenis="reward" tahun={tahun} bulan={bulan}/>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead><tr><th>#</th><th>NIK</th><th>Nama</th><th>Divisi</th><th className="text-right">Score</th><th>Grade</th><th>Reward / Punishment</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={r.nik}>
                <td className="mono">{i+1}</td>
                <td className="mono">{r.nik}</td>
                <td className="font-medium">{r.nama}</td>
                <td>{r.divisi}</td>
                <td className="text-right mono">{(r.score*100).toFixed(2)}%</td>
                <td><GradePill g={r.grade}/></td>
                <td>{r.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
