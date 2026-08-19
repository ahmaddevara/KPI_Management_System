import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { MasterDivisi, MasterJabatan, MasterKaryawan, MasterKPI } from "@/pages/MasterPages";
import TargetKPI from "@/pages/TargetKPI";
import InputKPI from "@/pages/InputKPI";
import { RekapIndividu, RekapDivisi, RekapPerusahaan, RewardPunishment } from "@/pages/Rekap";
import SettingPage from "@/pages/Setting";
import ImportExcel from "@/pages/ImportExcel";
import UserManagement from "@/pages/UserManagement";

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="p-8 text-sm text-gray-500">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace/>;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route element={<Guard><Layout/></Guard>}>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/master/divisi" element={<Guard roles={["admin"]}><MasterDivisi/></Guard>}/>
            <Route path="/master/jabatan" element={<Guard roles={["admin"]}><MasterJabatan/></Guard>}/>
            <Route path="/master/karyawan" element={<Guard roles={["admin"]}><MasterKaryawan/></Guard>}/>
            <Route path="/master/kpi" element={<Guard roles={["admin"]}><MasterKPI/></Guard>}/>
            <Route path="/target-kpi" element={<Guard roles={["admin","supervisor"]}><TargetKPI/></Guard>}/>
            <Route path="/input-kpi" element={<Guard roles={["admin","supervisor"]}><InputKPI/></Guard>}/>
            <Route path="/rekap/individu" element={<RekapIndividu/>}/>
            <Route path="/rekap/divisi" element={<Guard roles={["admin","supervisor"]}><RekapDivisi/></Guard>}/>
            <Route path="/rekap/perusahaan" element={<Guard roles={["admin","supervisor"]}><RekapPerusahaan/></Guard>}/>
            <Route path="/reward" element={<Guard roles={["admin","supervisor"]}><RewardPunishment/></Guard>}/>
            <Route path="/setting" element={<Guard roles={["admin"]}><SettingPage/></Guard>}/>
            <Route path="/import" element={<Guard roles={["admin"]}><ImportExcel/></Guard>}/>
            <Route path="/users" element={<Guard roles={["admin"]}><UserManagement/></Guard>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
