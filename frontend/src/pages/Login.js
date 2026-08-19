import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatErr } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { LogIn } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, pw);
      toast.success("Selamat datang!");
      nav("/");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <Toaster />
      <div className="hidden lg:block relative">
        <img
          alt="office"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1724906019868-93ad2c79414f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBvZmZpY2UlMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzg3MTEyNzY5fDA&ixlib=rb-4.1.0&q=85"
        />
        <div className="absolute inset-0 bg-[#111827]/70" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase opacity-70">AP Group</div>
            <div className="heading text-3xl font-semibold tracking-tight mt-1">KPI Management</div>
          </div>
          <div className="max-w-md">
            <div className="text-xs uppercase tracking-[0.25em] opacity-70 mb-3">Sistem Perhitungan</div>
            <div className="heading text-2xl leading-tight">
              Ubah lembar Excel jadi dasbor perusahaan. Perhitungan bobot, achievement, grade — semua otomatis.
            </div>
          </div>
          <div className="text-xs opacity-70">© {new Date().getFullYear()} AP Group Internal Tools</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
          <div className="mb-8">
            <div className="text-xs tracking-[0.25em] uppercase text-gray-500">Masuk</div>
            <h1 className="heading text-3xl font-semibold tracking-tight mt-1">Selamat datang kembali</h1>
            <p className="text-sm text-gray-600 mt-2">Gunakan email dan kata sandi akun Anda.</p>
          </div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
          <input
            data-testid="login-email"
            type="email"
            required
            className="w-full border border-gray-300 rounded-sm px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#0052FF] focus:border-[#0052FF]"
            value={email} onChange={(e)=>setEmail(e.target.value)}
            placeholder="devaraahmad@gmail.com"
          />
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Kata Sandi</label>
          <input
            data-testid="login-password"
            type="password"
            required
            className="w-full border border-gray-300 rounded-sm px-3 py-2 mb-6 focus:outline-none focus:ring-1 focus:ring-[#0052FF] focus:border-[#0052FF]"
            value={pw} onChange={(e)=>setPw(e.target.value)}
          />
          <button
            data-testid="login-submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#111827] text-white py-2.5 rounded-sm hover:bg-black disabled:opacity-60"
          >
            <LogIn size={16}/> {loading ? "Memproses..." : "Masuk"}
          </button>
          <div className="mt-8 text-xs text-gray-500 border border-dashed border-gray-300 p-3 rounded-sm">
            <div className="font-semibold uppercase tracking-wider mb-1 text-gray-700">Akun Demo</div>
            <div>Admin: devaraahmad@gmail.com / Admin123!</div>
            <div>Supervisor: supervisor@apgroup.com / Supervisor123!</div>
            <div>Karyawan: karyawan@apgroup.com / Karyawan123!</div>
          </div>
        </form>
      </div>
    </div>
  );
}
