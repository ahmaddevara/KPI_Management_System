import React, { useEffect, useMemo, useRef, useState } from "react";
import api, { formatErr, MONTHS } from "@/lib/api";
import { toast } from "sonner";
import { Save, Filter, Copy, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const now = new Date();

export default function InputKPI() {
  const { user } = useAuth();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth()+1);
  const [divisi, setDivisi] = useState("");
  const [divisiList, setDivisiList] = useState([]);
  const [karyawan, setKaryawan] = useState([]);
  const [kpiMaster, setKpiMaster] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState({});
  const isSupervisor = user?.role === "supervisor";
  const supDivisi = user?.divisi || "";
  const reqIdRef = useRef(0);

  // Load master data whenever tahun changes
  useEffect(() => {
    (async () => {
      const [d, k, km, tg] = await Promise.all([
        api.get("/divisi"), api.get("/karyawan"), api.get("/kpi-master"),
        api.get("/kpi-target", { params: {tahun} }),
      ]);
      setDivisiList(d.data);
      setKaryawan(k.data);
      setKpiMaster(km.data);
      const t = {};
      tg.data.forEach(x => t[`${x.kode_kpi}-${x.tahun}-${x.bulan}`] = x.target);
      setTargets(t);
      setDivisi(cur => {
        if (isSupervisor && supDivisi) return supDivisi;
        if (cur) return cur;
        return d.data[0]?.nama || "";
      });
    })();
    // eslint-disable-next-line
  }, [tahun, isSupervisor, supDivisi]);

  // Reload input rows whenever divisi/bulan/tahun changes.
  // Uses reqId to prevent stale responses overwriting fresh state.
  useEffect(() => {
    if (!divisi) return;
    // clear immediately so old month data does not linger visually
    setInputs([]); setValues({}); setLoading(true);
    const rid = ++reqIdRef.current;
    api.get("/kpi-input", { params: { tahun, bulan, divisi } }).then(r => {
      if (rid !== reqIdRef.current) return;
      setInputs(r.data);
      const v = {};
      r.data.forEach(x => v[`${x.nik}::${x.kode_kpi}`] = x.realisasi);
      setValues(v);
    }).catch(e => toast.error(formatErr(e.response?.data?.detail)))
    .finally(() => { if (rid === reqIdRef.current) setLoading(false); });
  }, [divisi, bulan, tahun]);

  const karyawanDivisi = useMemo(() => karyawan.filter(k => k.divisi === divisi), [karyawan, divisi]);
  const kpiDivisi = useMemo(() => kpiMaster.filter(k => k.divisi === divisi), [kpiMaster, divisi]);

  const refresh = async () => {
    const r = await api.get("/kpi-input", { params: { tahun, bulan, divisi } });
    setInputs(r.data);
    const v = {};
    r.data.forEach(x => v[`${x.nik}::${x.kode_kpi}`] = x.realisasi);
    setValues(v);
  };

  const save = async () => {
    setSaving(true);
    try {
      const rows = [];
      for (const kar of karyawanDivisi) {
        for (const kpi of kpiDivisi) {
          const key = `${kar.nik}::${kpi.kode}`;
          const real = values[key];
          if (real === undefined || real === "" || real === null) continue;
          rows.push({ tahun, bulan, nik: kar.nik, kode_kpi: kpi.kode, realisasi: +real });
        }
      }
      if (!rows.length) { toast.info("Tidak ada perubahan"); return; }
      await api.post("/kpi-input/bulk", rows);
      toast.success(`${rows.length} data KPI tersimpan${isSupervisor ? " (status: draft, tekan Submit untuk kirim ke Admin)" : ""}`);
      await refresh();
    } catch(e) { toast.error(formatErr(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const copyPrev = async () => {
    if (!window.confirm("Salin semua realisasi dari bulan sebelumnya ke bulan ini?")) return;
    try {
      const { data } = await api.post("/kpi-input/copy-previous", { tahun, bulan, divisi });
      toast.success(`Berhasil salin ${data.copied} entri dari ${data.from}`);
      await refresh();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };

  const submitAll = async () => {
    if (!window.confirm("Submit semua data KPI divisi ini untuk persetujuan Admin?")) return;
    try {
      const { data } = await api.post("/kpi-input/submit", { tahun, bulan, divisi });
      toast.success(`${data.submitted} data disubmit`);
      await refresh();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };

  const getEnriched = (nik, kode) => inputs.find(i => i.nik === nik && i.kode_kpi === kode);

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Perencanaan</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">Input KPI Bulanan</h1>
          <p className="text-sm text-gray-600">
            {isSupervisor
              ? <>Anda supervisor divisi <span className="pill pill-neutral ml-1">{supDivisi || "belum ditentukan"}</span>. Input akan tersimpan sebagai <em>draft</em>, lalu tekan <em>Submit</em> untuk kirim ke Admin.</>
              : "Isi realisasi. Achievement, Nilai, dan Status dihitung otomatis."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500"/>
          {isSupervisor ? (
            <div className="pill pill-neutral" data-testid="input-divisi-locked">Divisi: {supDivisi || "—"}</div>
          ) : (
            <select data-testid="input-divisi" value={divisi} onChange={e=>setDivisi(e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
              {divisiList.map(d=><option key={d.id} value={d.nama}>{d.nama}</option>)}
            </select>
          )}
          <select data-testid="input-bulan" value={bulan} onChange={e=>setBulan(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select data-testid="input-tahun" value={tahun} onChange={e=>setTahun(+e.target.value)} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
            {[tahun-1, tahun, tahun+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={save} disabled={saving} data-testid="input-save" className="flex items-center gap-2 bg-[#0052FF] text-white px-3 py-2 rounded-sm text-sm hover:bg-blue-700">
            <Save size={14}/> {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button onClick={copyPrev} data-testid="input-copy-prev" className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-sm text-sm hover:bg-gray-50">
            <Copy size={14}/> Copy Bulan Lalu
          </button>
          {isSupervisor && (
            <button onClick={submitAll} data-testid="input-submit" className="flex items-center gap-2 bg-[#111827] text-white px-3 py-2 rounded-sm text-sm">
              <Send size={14}/> Submit
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 text-xs text-gray-500 mono" data-testid="input-context">
        Menampilkan: <span className="font-semibold text-[#111827]">{MONTHS[bulan-1]} {tahun}</span> · Divisi <span className="font-semibold text-[#111827]">{divisi || "—"}</span> {loading && <><Loader2 size={12} className="inline animate-spin ml-2"/> memuat…</>}
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full min-w-max">
          <thead>
            <tr>
              <th>Karyawan</th><th>KPI</th><th className="text-right">Target</th>
              <th className="text-right">Realisasi</th>
              <th className="text-right">Achievement</th>
              <th className="text-right">Bobot</th>
              <th className="text-right">Nilai</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {karyawanDivisi.flatMap(kar => kpiDivisi.map(kpi => {
              const e = getEnriched(kar.nik, kpi.kode) || {};
              const target = e.target ?? targets[`${kpi.kode}-${tahun}-${bulan}`] ?? 0;
              const key = `${kar.nik}::${kpi.kode}`;
              const st = e.status_kpi;
              const wf = e.status || "belum-diisi";
              const wfPill = {approved:"pill-ok", submitted:"pill-warn", draft:"pill-neutral", rejected:"pill-danger", "belum-diisi":"pill-neutral"}[wf];
              return (
                <tr key={key}>
                  <td>
                    <div className="font-medium">{kar.nama}</div>
                    <div className="text-[10px] text-gray-500 mono">{kar.nik}</div>
                  </td>
                  <td>
                    <div>{kpi.nama}</div>
                    <div className="text-[10px] text-gray-500 mono">{kpi.kode} — {kpi.satuan} · {kpi.arah_nilai}</div>
                  </td>
                  <td className="text-right mono">{Number(target).toFixed(2)}</td>
                  <td className="text-right">
                    <input
                      data-testid={`realisasi-${kar.nik}-${kpi.kode}`}
                      type="number" step="0.01"
                      value={values[key] ?? ""}
                      onChange={ev => setValues(prev => ({...prev, [key]: ev.target.value}))}
                      className="w-24 border border-gray-200 rounded-sm px-1 py-1 text-right mono text-xs"
                    />
                  </td>
                  <td className="text-right mono">{e.achievement != null ? (e.achievement*100).toFixed(2)+"%" : "-"}</td>
                  <td className="text-right mono">{kpi.bobot}</td>
                  <td className="text-right mono">{e.nilai != null ? e.nilai.toFixed(2) : "-"}</td>
                  <td>
                    {st && <span className={`pill ${st==="On Track"?"pill-ok":"pill-danger"} mr-1`}>{st}</span>}
                    <span className={`pill ${wfPill}`}>{wf}</span>
                  </td>
                </tr>
              );
            }))}
            {karyawanDivisi.length===0 && <tr><td colSpan="8" className="text-center text-gray-400 py-6">Belum ada karyawan di divisi ini</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
