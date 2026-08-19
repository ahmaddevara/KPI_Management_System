# AP GROUP - KPI Management System

## Original Problem Statement
"buatkan saya sistem KPI menggunakan website dengan template penghitungan KPI seperti diatas."
User provided Excel template: AP_GROUP_KPI_Management_System_v2.xlsm

## Architecture
- Backend: FastAPI + MongoDB (Motor), JWT auth (bcrypt), openpyxl (import), reportlab (PDF export)
- Frontend: React (CRA), Tailwind, shadcn/ui components, recharts, sonner, lucide-react
- Design: Swiss Brutalist / Data-density (Work Sans + IBM Plex Sans)
- Language: Bahasa Indonesia

## Core Requirements (Static)
1. Multi-user JWT login: Admin / Supervisor / Karyawan
2. Master Data (Divisi, Jabatan, Karyawan, Master KPI)
3. Target KPI matrix (Jan-Des) per KPI per tahun
4. Input KPI: realisasi bulanan per karyawan × KPI, auto compute Achievement / Nilai / Status
5. Rekap Individu / Divisi / Perusahaan + Reward & Punishment (grade A-E)
6. Dashboard: overall score, trend, grade distribution, ranking, KPI per divisi
7. Excel import (auto-seed from AP Group template on first startup + manual upload)
8. Export ke Excel & PDF
9. Setting: grading thresholds custom

## User Personas
- Admin/HR (devaraahmad@gmail.com) — full CRUD + user management + import/export + setting
- Supervisor — input target & realisasi + view rekap
- Karyawan — view own KPI only (RBAC scoped by NIK)

## Implemented (2026-02)
- Backend: 40+ endpoints (auth, CRUD master, target/input bulk, rekap agregasi, dashboard, reward-punishment, export excel/pdf, import excel dgn cleanup drawings)
- Frontend: 14 pages, sidebar navigation dengan RBAC, dashboard dengan chart Recharts, semua CRUD form
- Auto-import template menghasilkan: 6 divisi, 10 jabatan, 9 karyawan, 31 KPI, 372 target, 392 input
- Grading standar: A>=95 B>=85 C>=75 D>=65 E<65, on_track 85%
- RBAC scoped: karyawan hanya lihat data sendiri

## Backlog / Next Phase (P1)
- Notifikasi email bulanan (Resend) untuk laporan
- Persetujuan alur (approval workflow) Supervisor -> Admin
- Multi-tahun perbandingan
- Bulk import Excel dari format lain
- KPI drilldown (klik divisi lihat KPI detail)
- Bulk edit realisasi + copy dari bulan sebelumnya
