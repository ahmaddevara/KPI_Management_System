import React, { useEffect, useState } from "react";
import MasterCrud from "@/pages/MasterCrud";
import api from "@/lib/api";

export function MasterDivisi() {
  return <MasterCrud title="Divisi" endpoint="/divisi" testidPrefix="divisi"
    columns={[{key:"kode",label:"Kode"},{key:"nama",label:"Nama Divisi"}]}/>;
}

export function MasterJabatan() {
  const [divisi, setDivisi] = useState([]);
  useEffect(()=>{ api.get("/divisi").then(r=>setDivisi(r.data.map(d=>d.nama))); }, []);
  return <MasterCrud title="Jabatan" endpoint="/jabatan" testidPrefix="jabatan"
    columns={[{key:"kode",label:"Kode"},{key:"nama",label:"Jabatan"},{key:"divisi",label:"Divisi",type:"select",options:divisi}]}/>;
}

export function MasterKaryawan() {
  const [divisi, setDivisi] = useState([]);
  const [jabatan, setJabatan] = useState([]);
  useEffect(()=>{
    api.get("/divisi").then(r=>setDivisi(r.data.map(d=>d.nama)));
    api.get("/jabatan").then(r=>setJabatan(r.data.map(d=>d.nama)));
  }, []);
  return <MasterCrud title="Karyawan" endpoint="/karyawan" testidPrefix="karyawan"
    columns={[
      {key:"nik",label:"NIK"},
      {key:"nama",label:"Nama"},
      {key:"divisi",label:"Divisi",type:"select",options:divisi},
      {key:"jabatan",label:"Jabatan",type:"select",options:jabatan},
      {key:"atasan",label:"Atasan"},
      {key:"status",label:"Status",type:"select",options:["Aktif","Tidak Aktif"]},
    ]}/>;
}

export function MasterKPI() {
  const [divisi, setDivisi] = useState([]);
  useEffect(()=>{ api.get("/divisi").then(r=>setDivisi(r.data.map(d=>d.nama))); }, []);
  return <MasterCrud title="Master KPI" endpoint="/kpi-master" testidPrefix="kpi"
    columns={[
      {key:"divisi",label:"Divisi",type:"select",options:divisi},
      {key:"kode",label:"Kode KPI"},
      {key:"nama",label:"Nama KPI"},
      {key:"satuan",label:"Satuan"},
      {key:"bobot",label:"Bobot (%)",type:"number"},
      {key:"arah_nilai",label:"Arah",type:"select",options:["Higher","Lower"]},
      {key:"jenis_target",label:"Jenis",type:"select",options:["Rasio","Kumulatif"]},
    ]}/>;
}
