"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { RiImageAddFill, RiCheckFill, RiCloseFill, RiAlertFill, RiLoader4Line } from "react-icons/ri";
import Image from "next/image";

export default function ScannerPage() {
  const [info, setInfo] = useState({
    status: "MENCARI KAMERA...",
    nama: "Mohon Tunggu",
    color: "bg-slate-800",
  });

  const [targetName, setTargetName] = useState("KEHADIRAN");
  const [showPopup, setShowPopup] = useState(false);
  const [popupTheme, setPopupTheme] = useState({
    text: "text-emerald-600", bg: "bg-emerald-600", icon: <RiCheckFill />
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";
    const getFriendlyName = (slug: string) => {
      if (slug === "registrasi_ulang") return "KEHADIRAN";
      return slug.replace(/_/g, " ").toUpperCase();
    };
    setTargetName(getFriendlyName(s));

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;
    startCamera(s);

    return () => { stopCamera(); };
  }, []);

  const startCamera = async (s: string) => {
    if (!scannerRef.current) return;
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') && !d.label.toLowerCase().includes('wide')) || devices[0];
        await scannerRef.current.start(
          backCamera.id,
          { fps: 60, qrbox: { width: 220, height: 220 }, disableFlip: true },
          (decodedText) => handleScanData(decodedText, s),
          () => { }
        );
        setInfo({ status: "SIAP SCAN", nama: "Arahkan ke QR Code", color: "bg-slate-800" });
      }
    } catch (err) {
      setInfo({ status: "ERROR", nama: "Izinkan Kamera", color: "bg-red-800" });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) await scannerRef.current.stop();
  };

  const handleScanData = async (id: string, targetSheet: string) => {
    await stopCamera(); 
    setInfo({ status: "MEMPROSES...", nama: "Mohon Tunggu", color: "bg-amber-500" });
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL!, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ id, targetSheet }),
      });
      const result = await response.json();
      
      if (result.status === "success") {
        setInfo({ status: "BERHASIL", nama: result.nama, color: "bg-emerald-600" });
        setPopupTheme({ text: "text-emerald-600", bg: "bg-emerald-600", icon: <RiCheckFill /> });
      } else if (result.status === "already_exists") {
        // Menambahkan info waktu jika ada data waktu dari server
        const detailWaktu = result.waktu ? `\nPada: ${result.waktu}` : "";
        setInfo({ 
          status: "DUPLIKAT", 
          nama: `${result.nama} (Sudah Presensi)${detailWaktu}`, 
          color: "bg-orange-500" 
        });
        setPopupTheme({ text: "text-orange-500", bg: "bg-orange-500", icon: <RiAlertFill /> });
      } else {
        setInfo({ status: "TIDAK VALID", nama: "ID Tidak Terdaftar", color: "bg-red-600" });
        setPopupTheme({ text: "text-red-600", bg: "bg-red-600", icon: <RiCloseFill /> });
      }
      setShowPopup(true); 
    } catch {
      setInfo({ status: "ERROR", nama: "Koneksi Bermasalah", color: "bg-red-800" });
      setShowPopup(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 py-4 flex flex-col items-center shadow-md z-30">
         <div className="flex items-center gap-3 mb-1">
            <div className="relative w-10 h-10">
               <Image src="/asset/image.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col">
               <h2 className="text-blue-900 font-black text-xs leading-none uppercase">Rakernas V IHGMA</h2>
               <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Lombok - NTB 2026</p>
            </div>
         </div>
         <div className="w-full h-px bg-slate-100 my-2"></div>
         <p className="text-[11px] font-black text-blue-900 tracking-[0.3em] uppercase">SCAN {targetName}</p>
      </div>

      {/* 2. AREA KAMERA */}
      <div className="relative flex-1 bg-black overflow-hidden z-10">
         <div id="reader" className="w-full h-full"></div>
         
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-10">
            <div className="w-full max-w-[240px] aspect-square border-2 border-blue-400 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
               <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
               <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
               <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
               <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
         </div>

         <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <label className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer active:scale-90 transition-all">
               <input type="file" hidden onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    setInfo({ status: "MENYIAPKAN...", nama: "Membaca File", color: "bg-blue-600" });
                    stopCamera().then(() => {
                      scannerRef.current?.scanFile(file, true).then(id => handleScanData(id, new URLSearchParams(window.location.search).get("s") || "registrasi_ulang"));
                    });
                  }
               }} />
               <RiImageAddFill className="text-3xl text-slate-800" />
            </label>
         </div>
      </div>

      {/* 3. FOOTER STATUS */}
      <div className={`flex-shrink-0 p-6 ${info.color} text-white text-center shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-30`}>
         <p className="font-black text-lg uppercase truncate mb-1 tracking-tight">{info.nama.split('\n')[0]}</p>
         <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase">
            {(info.status.includes("PROSES") || info.status.includes("CARI") || info.status.includes("SIAPKAN")) && (
               <RiLoader4Line className="animate-spin text-sm" />
            )}
            {info.status}
         </div>
      </div>

      {/* 4. POPUP RESULT */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-6">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl border-t-[10px] border-current" style={{borderColor: 'currentColor'}}>
            <div className={`text-7xl flex justify-center mb-6 ${popupTheme.text}`}>{popupTheme.icon}</div>
            <h2 className={`text-2xl font-black mb-2 uppercase ${popupTheme.text}`}>{info.status}</h2>
            <div className="text-slate-500 font-bold mb-10 uppercase text-sm leading-tight px-4 whitespace-pre-line">
              {info.nama}
            </div>
            <button onClick={() => { setShowPopup(false); startCamera(new URLSearchParams(window.location.search).get("s") || "registrasi_ulang"); }} 
                    className={`w-full py-4 rounded-2xl font-black text-white ${popupTheme.bg} shadow-lg active:scale-95 transition-all uppercase tracking-widest`}>
              OK, LANJUT SCAN
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        #reader { border: none !important; }
      `}</style>
    </div>
  );
}