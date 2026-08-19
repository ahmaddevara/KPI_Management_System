import React, { useEffect, useState } from "react";
import api, { MONTHS } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine } from "recharts";
import { TrendingUp, Users, Target as TargetIcon, Activity } from "lucide-react";

const now = new Date();

function Card({ label, value, sub, tone="default", testid }) {
  const toneMap = { ok: "border-l-4 border-l-[#059669]", warn: "border-l-4 border-l-[#D97706]", danger: "border-l-4 border-l-[#DC2626]", brand: "border-l-4 border-l-[#0052FF]", default: "" };
  return (
    <div data-testid={testid} className={`bg-white border border-gray-200 rounded-sm p-4 ${toneMap[tone]}`}>
      <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">{label}</div>
      <div className="heading text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/dashboard/overview`, { params: { tahun, bulan } }).then(r => setData(r.data));
  }, [tahun, bulan]);

  if (!data) return <div className="text-sm text-gray-500">Memuat...</div>;

  const overall = (data.overall_score * 100).toFixed(2);
  const target = (data.target * 100).toFixed(0);
  const gap = (data.gap * 100).toFixed(2);

  const divData = data.divisi.map(d => ({ divisi: d.divisi, aktual: +(d.score*100).toFixed(2), target: +(d.target*100).toFixed(2) }));
  const trendData = data.trend.map(t => ({ bulan: t.bulan_short, aktual: +(t.score*100).toFixed(2), target: +(t.target*100).toFixed(2) }));

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Beranda</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">KPI Perusahaan</h1>
          <p className="text-sm text-gray-600">Ringkasan performa {MONTHS[bulan-1]} {tahun}</p>
        </div>
        <div className="flex items-center gap-2">
          <select data-testid="filter-bulan" value={bulan} onChange={e=>setBulan(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select data-testid="filter-tahun" value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
            {[tahun-1, tahun, tahun+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card testid="kpi-overall" label="Overall KPI" value={`${overall}%`} sub={`Target ${target}%`} tone={+overall >= +target ? "ok":"danger"} />
        <Card testid="kpi-gap" label="Gap vs Target" value={`${gap}%`} sub={+gap >= 0 ? "Di atas target" : "Di bawah target"} tone={+gap>=0?"ok":"warn"} />
        <Card testid="kpi-karyawan" label="Karyawan Dinilai" value={data.karyawan_dinilai} sub={`${data.on_track} on-track`} tone="brand" />
        <Card testid="kpi-ontrack" label="On Track" value={data.on_track} sub={`dari ${data.karyawan_dinilai} karyawan`} tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">Trend KPI Perusahaan</div>
              <div className="heading text-lg font-semibold">Aktual vs Target {tahun}</div>
            </div>
            <TrendingUp size={16} className="text-gray-400"/>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{top:10,right:20,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey="bulan" tick={{fontSize:12, fill:"#6B7280"}}/>
              <YAxis tick={{fontSize:12, fill:"#6B7280"}} unit="%"/>
              <Tooltip formatter={(v)=>`${v}%`} contentStyle={{fontSize:12, borderRadius:2}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Line type="monotone" dataKey="target" stroke="#9CA3AF" strokeDasharray="4 4" dot={false}/>
              <Line type="monotone" dataKey="aktual" stroke="#0052FF" strokeWidth={2} dot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">Distribusi Grade</div>
          <div className="heading text-lg font-semibold mb-3">Karyawan per Grade</div>
          <div className="space-y-2">
            {["A","B","C","D","E"].map(g=>{
              const count = data.grade_distribusi[g] || 0;
              const total = Math.max(1, Object.values(data.grade_distribusi).reduce((a,b)=>a+b,0));
              const pct = (count/total)*100;
              return (
                <div key={g}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-semibold">Grade {g}</span><span className="text-gray-500">{count} orang</span></div>
                  <div className="bar-track"><div className={`bar-fill ${g==="A"||g==="B"?"ok":g==="C"?"warn":"danger"}`} style={{width:`${pct}%`}}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">KPI per Divisi</div>
          <div className="heading text-lg font-semibold mb-3">Target vs Aktual</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={divData} margin={{top:10,right:20,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey="divisi" tick={{fontSize:12, fill:"#6B7280"}}/>
              <YAxis tick={{fontSize:12, fill:"#6B7280"}} unit="%"/>
              <Tooltip formatter={(v)=>`${v}%`} contentStyle={{fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <ReferenceLine y={+target} stroke="#9CA3AF" strokeDasharray="4 4"/>
              <Bar dataKey="aktual" fill="#0052FF" radius={[2,2,0,0]}/>
              <Bar dataKey="target" fill="#E5E7EB" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">Ranking Individu</div>
          <div className="heading text-lg font-semibold mb-3">Top 10 Karyawan</div>
          <table className="data-table w-full">
            <thead><tr><th>#</th><th>Nama</th><th>Divisi</th><th className="text-right">Score</th></tr></thead>
            <tbody>
              {data.ranking.map((r,i)=>(
                <tr key={r.nik}>
                  <td className="mono">{i+1}</td>
                  <td>{r.nama}</td>
                  <td><span className="pill pill-neutral">{r.divisi}</span></td>
                  <td className="mono text-right">{(r.score*100).toFixed(2)}%</td>
                </tr>
              ))}
              {data.ranking.length===0 && <tr><td colSpan="4" className="text-center text-gray-400 py-3">Belum ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
