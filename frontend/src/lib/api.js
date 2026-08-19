import axios from "axios";
export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, withCredentials: true });

client.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("kpi_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default client;

export function formatErr(detail) {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
export const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
