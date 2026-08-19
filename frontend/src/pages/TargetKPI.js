import React, { useEffect, useState } from "react";
import api, { formatErr, MONTHS_SHORT } from "@/lib/api";
import { toast } from "sonner";
import { Save } from "lucide-react";

const now = new Date();
export default function TargetKPI() {
  const [tahun, setTahun] = useState(now.getFullYear());
  const [kpiList, setKpiList] = useState([]);
  const [values, setValues] = useState({}); // {kode: [12 targets]}
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [km, tg] = await Promise.all([api.get("/kpi-master"), api.get("/kpi-target", {params:{tahun}})]);
      setKpiList(km.data);
      const map = {};
      km.data.forEach(k => map[k.kode] = Array(12).fill(0));
      tg.data.forEach(t => { if (!map[t.kode_kpi]) map[t.kode_kpi] = Array(12).fill(0); map[t.kode_kpi][t.bulan-1] = t.target; });
      setValues(map);
    })();
  }, [tahun]);

  const save = async () => {
    setSaving(true);
    try {
      const rows = [];
      for (const [kode, arr] of Object.entries(values)) {
        for (let m=0;m<12;m++) rows.push({ kode_kpi: kode, tahun, bulan: m+1, target: +arr[m] || 0 });
      }
      await api.post("/kpi-target/bulk", rows);
      toast.success("Target KPI tersimpan");
    } catch(e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Perencanaan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Target KPI Bulanan</h1>
          <p className="text-sm text-gray-600">Matrix target per bulan untuk tahun {tahun}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="target-tahun">
            {[tahun-1, tahun, tahun+1, tahun+2].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={save} disabled={saving} data-testid="target-save" className="flex items-center gap-2 bg-[#0052FF] text-white px-3 py-2 rounded-sm text-sm hover:bg-blue-700">
            <Save size={14}/> {saving?"Menyimpan...":"Simpan Target"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead>
            <tr>
              <th>Divisi</th><th>Kode</th><th>Nama KPI</th><th>Satuan</th>
              {MONTHS_SHORT.map(m=><th key={m} className="text-right">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {kpiList.map(k => (
              <tr key={k.kode}>
                <td>{k.divisi}</td>
                <td className="mono">{k.kode}</td>
                <td>{k.nama}</td>
                <td className="text-gray-500">{k.satuan}</td>
                {Array.from({length:12}).map((_,i)=>(
                  <td key={i} className="p-1">
                    <input
                      data-testid={`target-${k.kode}-${i+1}`}
                      type="number" step="0.01"
                      value={values[k.kode]?.[i] ?? 0}
                      onChange={e => {
                        const arr = [...(values[k.kode]||Array(12).fill(0))];
                        arr[i] = e.target.value;
                        setValues({...values, [k.kode]: arr});
                      }}
                      className="w-20 border border-gray-200 rounded-sm px-1 py-1 text-right mono text-xs"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
