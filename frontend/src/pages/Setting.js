import React, { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { Save } from "lucide-react";

const FIELDS = [
  { key: "threshold_a", label: "Grade A ≥ (%)", group: "KPI Grading" },
  { key: "threshold_b", label: "Grade B ≥ (%)", group: "KPI Grading" },
  { key: "threshold_c", label: "Grade C ≥ (%)", group: "KPI Grading" },
  { key: "threshold_d", label: "Grade D ≥ (%)", group: "KPI Grading" },
  { key: "on_track_min", label: "Ambang On Track (%)", group: "KPI Grading" },
  { key: "rate_lembur", label: "Rate Lembur / Jam (Rp)", group: "Payroll" },
  { key: "rate_terlambat", label: "Rate Terlambat / Jam (Rp)", group: "Payroll" },
  { key: "rate_tidak_masuk", label: "Rate Tidak Masuk / Hari (Rp)", group: "Payroll" },
];

export default function SettingPage() {
  const [form, setForm] = useState({});
  useEffect(()=>{ api.get("/setting").then(r=>setForm(r.data)); }, []);
  const save = async () => {
    try {
      const payload = {};
      FIELDS.forEach(f => payload[f.key] = +form[f.key]);
      await api.put("/setting", payload);
      toast.success("Pengaturan tersimpan");
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };
  return (
    <div>
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Admin</div>
        <h1 className="heading text-3xl font-semibold tracking-tight">Pengaturan Grading</h1>
        <p className="text-sm text-gray-600">Ubah ambang batas grade dan status on-track.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-sm p-4 max-w-2xl">
        {["KPI Grading","Payroll"].map(group => (
          <div key={group} className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{group}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FIELDS.filter(f=>f.group===group).map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">{f.label}</label>
                  <input data-testid={`setting-${f.key}`} type="number" step="0.01"
                    value={form[f.key] ?? ""} onChange={e=>setForm({...form, [f.key]: e.target.value})}
                    className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-sm mono"/>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={save} data-testid="setting-save" className="mt-2 flex items-center gap-2 bg-[#0052FF] text-white px-3 py-2 rounded-sm text-sm">
          <Save size={14}/> Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
