import React, { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, X, Save } from "lucide-react";

/**
 * Generic Master CRUD page.
 * Props:
 *   title, endpoint, columns: [{key,label,type,options?,required?}], testidPrefix
 */
export default function MasterCrud({ title, endpoint, columns, testidPrefix }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // object or null
  const [form, setForm] = useState({});

  const load = async () => {
    const { data } = await api.get(endpoint);
    setItems(data);
  };
  useEffect(() => { load(); }, [endpoint]);

  const startAdd = () => { setForm({}); setEditing({}); };
  const startEdit = (row) => { setForm({...row}); setEditing(row); };
  const cancel = () => { setEditing(null); setForm({}); };

  const save = async () => {
    try {
      if (editing?.id) {
        await api.put(`${endpoint}/${editing.id}`, form);
        toast.success("Data diperbarui");
      } else {
        await api.post(endpoint, form);
        toast.success("Data ditambahkan");
      }
      cancel(); load();
    } catch(e) {
      toast.error(formatErr(e.response?.data?.detail) || e.message);
    }
  };

  const remove = async (row) => {
    if (!confirm(`Hapus data ini?`)) return;
    try {
      await api.delete(`${endpoint}/${row.id}`);
      toast.success("Data dihapus");
      load();
    } catch(e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Master Data</div>
          <h1 className="heading text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <button data-testid={`${testidPrefix}-add`} onClick={startAdd} className="flex items-center gap-2 bg-[#111827] text-white px-3 py-2 rounded-sm text-sm hover:bg-black">
          <Plus size={14}/> Tambah
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4">
          <div className="text-sm font-semibold mb-3 heading">{editing.id ? "Edit" : "Tambah Baru"}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {columns.map(c => (
              <div key={c.key}>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">{c.label}</label>
                {c.type === "select" ? (
                  <select value={form[c.key] ?? ""} onChange={e=>setForm({...form, [c.key]: e.target.value})} className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-sm">
                    <option value="">-</option>
                    {(c.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                ) : c.type === "number" ? (
                  <input type="number" step="0.01" value={form[c.key] ?? ""} onChange={e=>setForm({...form, [c.key]: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-sm"/>
                ) : (
                  <input value={form[c.key] ?? ""} onChange={e=>setForm({...form, [c.key]: e.target.value})} className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-sm"/>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button data-testid={`${testidPrefix}-save`} onClick={save} className="flex items-center gap-2 bg-[#0052FF] text-white px-3 py-1.5 rounded-sm text-sm"><Save size={14}/> Simpan</button>
            <button onClick={cancel} className="flex items-center gap-2 border border-gray-300 px-3 py-1.5 rounded-sm text-sm"><X size={14}/> Batal</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <table className="data-table w-full">
          <thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} data-testid={`${testidPrefix}-row-${row.id}`}>
                {columns.map(c=><td key={c.key}>{String(row[c.key] ?? "")}</td>)}
                <td className="text-right">
                  <button onClick={()=>startEdit(row)} className="text-gray-600 hover:text-black p-1" data-testid={`${testidPrefix}-edit-${row.id}`}><Edit3 size={14}/></button>
                  <button onClick={()=>remove(row)} className="text-red-600 hover:text-red-800 p-1 ml-1" data-testid={`${testidPrefix}-del-${row.id}`}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={columns.length+1} className="text-center text-gray-400 py-6">Belum ada data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
