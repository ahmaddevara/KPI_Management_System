import React, { useEffect, useState } from "react";
import api, { MONTHS_SHORT } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

const now = new Date();
const COLORS = ["#0052FF","#059669","#D97706","#DC2626","#7C3AED"];

export default function YoY() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [years, setYears] = useState(3);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/rekap/yoy", { params: { tahun, years } }).then(r=>setData(r.data));
  }, [tahun, years]);

  // Merge into single dataset for chart
  const merged = MONTHS_SHORT.map((m, i) => {
    const obj = { bulan: m };
    (data?.years || []).forEach(y => {
      const t = y.trend.find(t => t.bulan === i+1);
      obj[`y${y.tahun}`] = t ? +(t.score*100).toFixed(2) : null;
    });
    return obj;
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Laporan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Perbandingan Tahun (Year-on-Year)</h1>
          <p className="text-sm text-gray-600">Bandingkan performa KPI perusahaan lintas tahun.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={years} onChange={e=>setYears(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="yoy-range">
            <option value={2}>2 tahun terakhir</option>
            <option value={3}>3 tahun terakhir</option>
            <option value={5}>5 tahun terakhir</option>
          </select>
          <select value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="yoy-tahun">
            {[tahun-1, tahun, tahun+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4">
        <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500">Trend Multi-Tahun</div>
        <div className="heading text-lg font-semibold mb-3">Overall KPI Perusahaan</div>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={merged} margin={{top:10,right:20,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
            <XAxis dataKey="bulan" tick={{fontSize:12, fill:"#6B7280"}}/>
            <YAxis tick={{fontSize:12, fill:"#6B7280"}} unit="%"/>
            <Tooltip formatter={(v)=>`${v}%`} contentStyle={{fontSize:12, borderRadius:2}}/>
            <Legend wrapperStyle={{fontSize:12}}/>
            {(data?.years || []).map((y, i) => (
              <Line key={y.tahun} type="monotone" dataKey={`y${y.tahun}`}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={y.tahun===tahun ? 2.5 : 1.5}
                strokeDasharray={y.tahun===tahun ? "0" : "4 4"}
                dot={{r:3}}
                name={String(y.tahun)}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data?.years || []).map(y => {
          const scores = y.trend.map(t => t.score).filter(s => s > 0);
          const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
          const focus = y.tahun === tahun;
          return (
            <div key={y.tahun} className={`bg-white border rounded-sm p-4 ${focus ? "border-[#0052FF] border-2" : "border-gray-200"}`}>
              <div className="flex justify-between items-baseline">
                <div className="heading text-xl font-semibold">{y.tahun}</div>
                {focus && <span className="pill pill-neutral">Fokus</span>}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-2">Rata-rata Tahunan</div>
              <div className="text-3xl heading font-semibold mono mt-1">{(avg*100).toFixed(2)}%</div>
              <div className="text-xs text-gray-500 mt-1">{scores.length} bulan terisi</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
