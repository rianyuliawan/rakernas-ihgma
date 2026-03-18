"use client";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerPage() {
  const [info, setInfo] = useState({ 
    status: "SIAP SCAN", 
    nama: "Arahkan ke QR Code", 
    color: "bg-slate-800" 
  });

  useEffect(() => {
    // 1. Inisialisasi Scanner
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    // 2. Fungsi saat QR terdeteksi
    scanner.render(async (decodedText) => {
      setInfo({ status: "MEMPROSES...", nama: "Mohon Tunggu", color: "bg-yellow-600" });

      // Ambil parameter sheet dari URL (contoh: ?s=booth_1)
      const params = new URLSearchParams(window.location.search);
      const target = params.get("s") || "registrasi_ulang";

      try {
        const response = await fetch(process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" }, // Penting untuk menghindari CORS Google
          body: JSON.stringify({ 
            id: decodedText, 
            targetSheet: target 
          }),
        });

        const result = await response.json();

        if (result.status === "success") {
          setInfo({ 
            status: `BERHASIL: ${target.toUpperCase()}`, 
            nama: result.nama, 
            color: "bg-green-600" 
          });
        } else {
          setInfo({ 
            status: "TIDAK TERDAFTAR", 
            nama: "ID Salah / Bukan Peserta", 
            color: "bg-red-600" 
          });
        }
      } catch (error) {
        setInfo({ status: "ERROR KONEKSI", nama: "Cek Internet/API", color: "bg-red-800" });
      }
    });

    return () => scanner.clear();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 font-sans">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl w-full max-w-md border-b-[10px] border-slate-200">
        
        {/* Header Acara */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">RAKERNAS V IHGMA</h1>
          <div className="h-1 w-12 bg-blue-600 mx-auto mt-1 rounded-full"></div>
        </div>

        {/* Kotak Kamera */}
        <div id="reader" className="overflow-hidden rounded-3xl border-2 border-slate-100 shadow-inner bg-slate-50"></div>

        {/* Status Card */}
        <div className={`mt-8 p-6 ${info.color} text-white rounded-3xl shadow-lg transition-all duration-500 transform scale-100`}>
          <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase mb-1">Status Kehadiran</p>
          <p className="text-2xl font-black leading-tight truncate">{info.nama}</p>
          <div className="mt-3 py-1 px-3 bg-white/20 rounded-full inline-block text-[10px] font-bold tracking-wider">
            {info.status}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex justify-between items-center px-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Lombok - NTB 2026</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">System Online</p>
          </div>
        </div>

      </div>
    </div>
  );
}