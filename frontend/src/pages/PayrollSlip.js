import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import api, { formatErr, MONTHS } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Save, Download, FileText } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const fmtRp = (v) => `Rp ${Number(v||0).toLocaleString("id-ID")}`;

export default function PayrollSlip() {
  const { nik } = useParams();
  const [sp] = useSearchParams();
  const tahun = +sp.get("tahun");
  const bulan = +sp.get("bulan");
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const { data } = await api.get(`/payroll/${nik}`, { params: { tahun, bulan }});
    setData(data);
    setForm({
      lembur_jam: data.payroll?.lembur_jam ?? 0,
      terlambat_jam: data.payroll?.terlambat_jam ?? 0,
      tidak_masuk_hari: data.payroll?.tidak_masuk_hari ?? 0,
      potongan_pinjaman: data.payroll?.potongan_pinjaman ?? 0,
      potongan_lainnya: data.payroll?.potongan_lainnya ?? 0,
      bonus_lainnya: data.payroll?.bonus_lainnya ?? 0,
      periode_gaji: data.payroll?.periode_gaji ?? `${MONTHS[bulan-1]} ${tahun}`,
      catatan: data.payroll?.catatan ?? "",
    });
  };
  useEffect(() => { load(); /* eslint-disable-next-line */}, [nik, tahun, bulan]);

  const save = async () => {
    try {
      await api.post("/payroll", { ...form, nik, tahun, bulan });
      toast.success("Slip gaji tersimpan");
      load();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };

  const dl = async (fmt) => {
    const res = await api.get(`/payroll/slip/${nik}`, { params: { tahun, bulan, fmt }, responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url; a.download = `slip_${nik}_${tahun}_${bulan}.${fmt==="pdf"?"pdf":"xlsx"}`;
    a.click();
  };

  if (!data) return <div className="text-sm text-gray-500">Memuat...</div>;
  const k = data.karyawan; const h = data.hasil;

  const inputRp = (key, label) => (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <input type="number" data-testid={`slip-${key}`} value={form[key] ?? 0}
        onChange={e=>setForm({...form, [key]: parseFloat(e.target.value) || 0})}
        className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-sm mono text-right"/>
    </div>
  );

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Payroll</div>
          <button onClick={()=>nav(-1)} className="text-sm text-gray-600 hover:text-black mb-1 flex items-center gap-1"><ArrowLeft size={14}/> Kembali</button>
          <h1 className="heading text-3xl font-semibold tracking-tight">Slip Gaji — {k.nama}</h1>
          <p className="text-sm text-gray-600">{k.jabatan} · {MONTHS[bulan-1]} {tahun}</p>
        </div>
        <div className="flex items-center gap-2">
          <WhatsAppButton nik={nik} tahun={tahun} bulan={bulan} label="Kirim ke WhatsApp"/>
          <button onClick={save} data-testid="slip-save" className="flex items-center gap-2 bg-[#0052FF] text-white px-3 py-2 rounded-sm text-sm hover:bg-blue-700"><Save size={14}/> Simpan</button>
          <button onClick={()=>dl("excel")} data-testid="slip-dl-excel" className="flex items-center gap-1 border border-gray-300 px-3 py-2 rounded-sm text-sm hover:bg-gray-50"><Download size={14}/> Excel</button>
          <button onClick={()=>dl("pdf")} data-testid="slip-dl-pdf" className="flex items-center gap-1 border border-gray-300 px-3 py-2 rounded-sm text-sm hover:bg-gray-50"><FileText size={14}/> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* A. DATA KARYAWAN */}
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">A. Data Karyawan</div>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-500 w-1/3 py-1">Nama Karyawan</td><td className="font-medium">{k.nama}</td></tr>
                <tr><td className="text-gray-500 py-1">Jabatan</td><td>{k.jabatan}</td></tr>
                <tr><td className="text-gray-500 py-1">Sistem Kerja</td><td>{k.sistem_kerja || "Bulanan"}</td></tr>
                <tr><td className="text-gray-500 py-1">No Rekening</td><td className="mono">{k.no_rek} · {k.bank}</td></tr>
                <tr><td className="text-gray-500 py-1">Periode Gaji</td>
                  <td><input value={form.periode_gaji||""} onChange={e=>setForm({...form, periode_gaji: e.target.value})}
                    className="border border-gray-300 rounded-sm px-2 py-1 text-sm w-full" data-testid="slip-periode"/></td></tr>
              </tbody>
            </table>
          </div>

          {/* B. KOMPONEN GAJI */}
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">B. Komponen Gaji</div>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-500 py-1">Gaji Pokok</td><td className="text-right mono">{fmtRp(h.gaji_pokok)}</td></tr>
                <tr><td className="text-gray-500 py-1">Tunjangan Transportasi</td><td className="text-right mono">{fmtRp(h.tunjangan_transportasi)}</td></tr>
                <tr><td className="text-gray-500 py-1">Tunjangan Makan</td><td className="text-right mono">{fmtRp(h.tunjangan_makan)}</td></tr>
                <tr><td className="text-gray-500 py-1">Tunjangan Kesehatan</td><td className="text-right mono">{fmtRp(h.tunjangan_kesehatan)}</td></tr>
                <tr className="border-t border-gray-200"><td className="font-semibold py-2">Total Gaji Kotor</td><td className="text-right mono font-semibold">{fmtRp(h.total_gaji_kotor)}</td></tr>
              </tbody>
            </table>
            <div className="text-[10px] text-gray-500 mt-2">* Ubah komponen gaji pokok/tunjangan di halaman Master Karyawan.</div>
          </div>

          {/* C. LEMBUR & LAINNYA */}
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">C. Lembur / Lainnya</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {inputRp("lembur_jam", "Lembur (Jam)")}
              {inputRp("bonus_lainnya", "Bonus Lainnya (Rp)")}
            </div>
            <div className="text-sm flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">Lembur × Rp {(h.rate_lembur).toLocaleString('id-ID')} = <span className="mono text-[#111827]">{fmtRp(h.total_lembur)}</span></span>
              <span className="font-semibold">Total: <span className="mono">{fmtRp(h.total_lembur_lainnya)}</span></span>
            </div>
          </div>

          {/* D. POTONGAN */}
          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">D. Potongan Gaji</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {inputRp("terlambat_jam", "Terlambat / Izin (Jam)")}
              {inputRp("tidak_masuk_hari", "Tidak Masuk / Alpha (Hari)")}
              {inputRp("potongan_pinjaman", "Pinjaman / Kasbon (Rp)")}
              {inputRp("potongan_lainnya", "Potongan Lainnya (Rp)")}
            </div>
            <div className="text-xs text-gray-500 space-y-0.5 border-t border-gray-200 pt-2">
              <div>Terlambat: {form.terlambat_jam||0} jam × Rp {h.rate_terlambat.toLocaleString('id-ID')} = <span className="mono text-red-600">{fmtRp(h.pot_terlambat)}</span></div>
              <div>Tidak Masuk: {form.tidak_masuk_hari||0} hari × Rp {h.rate_tidak_masuk.toLocaleString('id-ID')} = <span className="mono text-red-600">{fmtRp(h.pot_tidak_masuk)}</span></div>
              <div className="text-sm text-right pt-1 font-semibold">Total Potongan: <span className="mono text-red-600">{fmtRp(h.total_potongan)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-4">
            <div className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2">F. Catatan</div>
            <textarea value={form.catatan||""} onChange={e=>setForm({...form, catatan: e.target.value})}
              className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-sm min-h-[80px]"
              data-testid="slip-catatan" placeholder="Catatan tambahan (opsional)"/>
          </div>
        </div>

        {/* E. REKAP - sticky sidebar */}
        <div>
          <div className="bg-[#111827] text-white rounded-sm p-5 sticky top-4">
            <div className="text-[10px] tracking-[0.15em] uppercase opacity-70 mb-3">E. Rekap Gaji</div>
            <div className="flex justify-between text-sm py-1"><span className="opacity-70">Total Gaji Kotor</span><span className="mono">{fmtRp(h.total_gaji_kotor)}</span></div>
            <div className="flex justify-between text-sm py-1"><span className="opacity-70">Total Lembur / Lainnya</span><span className="mono text-emerald-300">+{fmtRp(h.total_lembur_lainnya)}</span></div>
            <div className="flex justify-between text-sm py-1 border-b border-white/20 pb-3"><span className="opacity-70">Total Potongan</span><span className="mono text-red-300">-{fmtRp(h.total_potongan)}</span></div>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-widest opacity-70">Take Home Pay</div>
              <div className="text-3xl heading font-semibold mono mt-1" data-testid="slip-thp">{fmtRp(h.take_home_pay)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
