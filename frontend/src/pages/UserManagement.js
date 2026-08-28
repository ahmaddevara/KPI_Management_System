import React, { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email:"", name:"", role:"karyawan", password:"", nik:"", divisi:"" });
  const [karyawan, setKaryawan] = useState([]);
  const [divisiList, setDivisiList] = useState([]);

  const load = () => api.get("/auth/users").then(r=>setUsers(r.data));
  useEffect(() => {
    load();
    api.get("/karyawan").then(r=>setKaryawan(r.data));
    api.get("/divisi").then(r=>setDivisiList(r.data));
  }, []);

  const add = async () => {
    try {
      const payload = {
        email: form.email, name: form.name, role: form.role, password: form.password,
        nik: form.role === "karyawan" ? (form.nik || null) : null,
        divisi: form.role === "supervisor" ? (form.divisi || null) : null,
      };
      await api.post("/auth/register", payload);
      toast.success("User ditambahkan");
      setForm({ email:"", name:"", role:"karyawan", password:"", nik:"", divisi:"" });
      load();
    } catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };
  const del = async (id) => {
    if (!window.confirm("Hapus user ini?")) return;
    try { await api.delete(`/auth/users/${id}`); load(); toast.success("Terhapus"); }
    catch(e){ toast.error(formatErr(e.response?.data?.detail)); }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Admin</div>
        <h1 className="heading text-3xl font-semibold tracking-tight">User & Akses</h1>
        <p className="text-sm text-gray-600">
          Kelola akun. <span className="font-medium">Supervisor</span> dibaut khusus untuk satu divisi (misal MRKT_SPV → Marketing).
          <span className="font-medium"> Karyawan</span> dihubungkan ke NIK sehingga bisa melihat KPI-nya sendiri.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-6">
        <div className="text-sm font-semibold heading mb-3">Tambah User Baru</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input placeholder="Nama (mis. Stephan Eka)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="user-name"/>
          <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="user-email"/>
          <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="user-password"/>
          <select value={form.role} onChange={e=>setForm({...form, role:e.target.value, nik:"", divisi:""})} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="user-role">
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="karyawan">Karyawan</option>
          </select>
          {form.role === "supervisor" && (
            <select value={form.divisi} onChange={e=>setForm({...form, divisi:e.target.value})} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="user-divisi">
              <option value="">— Pilih Divisi yang Dinaungi —</option>
              {divisiList.map(d=><option key={d.id} value={d.nama}>{d.nama}</option>)}
            </select>
          )}
          {form.role === "karyawan" && (
            <select value={form.nik} onChange={e=>setForm({...form, nik:e.target.value})} className="border border-gray-300 rounded-sm px-2 py-1.5 text-sm" data-testid="user-nik">
              <option value="">— Pilih NIK Karyawan —</option>
              {karyawan.map(k=><option key={k.nik} value={k.nik}>{k.nik} — {k.nama} ({k.divisi})</option>)}
            </select>
          )}
        </div>
        <button onClick={add} data-testid="user-add" className="mt-3 flex items-center gap-2 bg-[#111827] text-white px-3 py-1.5 rounded-sm text-sm"><Plus size={14}/> Tambah User</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-auto">
        <table className="data-table w-full">
          <thead><tr><th>Email</th><th>Nama</th><th>Role</th><th>Cakupan</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td><span className="pill pill-neutral">{u.role}</span></td>
                <td className="mono text-xs">
                  {u.role === "supervisor" && (u.divisi ? <>Divisi {u.divisi}</> : <span className="text-red-600">(belum diset)</span>)}
                  {u.role === "karyawan" && (u.nik ? <>NIK {u.nik}</> : <span className="text-red-600">(belum diset)</span>)}
                  {u.role === "admin" && "Semua akses"}
                </td>
                <td className="text-right"><button data-testid={`user-del-${u.id}`} onClick={()=>del(u.id)} className="text-red-600 p-1"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
