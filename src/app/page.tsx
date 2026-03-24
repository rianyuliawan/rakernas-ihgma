"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { RiImageAddFill } from "react-icons/ri";

export default function ScannerPage() {
  const [info, setInfo] = useState({
    status: "MENCARI KAMERA...",
    nama: "Mohon Tunggu",
    color: "bg-slate-800",
  });

  const [targetName, setTargetName] = useState("KEHADIRAN");
  const [showPopup, setShowPopup] = useState(false);
  const [popupTheme, setPopupTheme] = useState({
    text: "text-green-600",
    bg: "bg-green-600",
    icon: "✅"
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";

    const getFriendlyName = (slug: string) => {
      if (slug === "registrasi_ulang") return "KEHADIRAN";
      return slug.replace("_", " ").toUpperCase();
    };

    setTargetName(getFriendlyName(s));

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    startCamera(s);

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (s: string) => {
    if (!scannerRef.current) return;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') && 
          !device.label.toLowerCase().includes('wide') &&
          !device.label.toLowerCase().includes('ultra')
        ) || devices[devices.length - 1];

        const qrConfig = { fps: 20, qrbox: { width: 220, height: 220 } };

        await scannerRef.current.start(
          backCamera.id,
          qrConfig,
          (decodedText) => handleScanData(decodedText, s),
          () => { }
        );

        setInfo({
          status: "SIAP SCAN",
          nama: "Arahkan ke QR Code",
          color: "bg-slate-800",
        });
      }
    } catch (err) {
      console.error(err);
      setInfo({
        status: "ERROR KAMERA",
        nama: "Izinkan Akses Kamera",
        color: "bg-red-800",
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
  };

  const handleScanData = async (id: string, targetSheet: string) => {
    await stopCamera(); 

    setInfo({
      status: "MEMPROSES...",
      nama: "Mohon Tunggu",
      color: "bg-yellow-600",
    });

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL!,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ id, targetSheet }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        setInfo({ status: "BERHASIL", nama: result.nama, color: "bg-green-600" });
        setPopupTheme({ text: "text-green-600", bg: "bg-green-600", icon: "✅" });
      } else if (result.status === "already_exists") {
        setInfo({ status: "DUPLIKAT", nama: result.nama + " (Sudah Absen)", color: "bg-orange-500" });
        setPopupTheme({ text: "text-orange-500", bg: "bg-orange-500", icon: "⚠️" });
      } else {
        setInfo({ status: "TIDAK VALID", nama: "ID Tidak Terdaftar", color: "bg-red-600" });
        setPopupTheme({ text: "text-red-600", bg: "bg-red-600", icon: "❌" });
      }
      setShowPopup(true); 
    } catch {
      setInfo({ status: "ERROR", nama: "Koneksi Bermasalah", color: "bg-red-800" });
      setPopupTheme({ text: "text-red-800", bg: "bg-red-800", icon: "❌" });
      setShowPopup(true);
    }
  };

  const handleContinueScan = () => {
    setShowPopup(false);
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";
    startCamera(s); 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";

    try {
      setInfo({ status: "MENYIAPKAN...", nama: "Mohon Tunggu", color: "bg-blue-600" });
      await stopCamera();
      await new Promise(r => setTimeout(r, 300));
      setInfo({ status: "MEMBACA QR...", nama: "Sedang Scan File", color: "bg-blue-600" });
      const decodedText = await scannerRef.current.scanFile(file, false);
      await handleScanData(decodedText, s);
    } catch {
      setInfo({ status: "GAGAL", nama: "QR Tidak Terbaca", color: "bg-red-600" });
      setPopupTheme({ text: "text-red-600", bg: "bg-red-600", icon: "❌" });
      setShowPopup(true);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-md h-[100dvh] md:h-[95vh] bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex-shrink-0 flex flex-col items-center py-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-1 uppercase">Sistem Scanner</p>
          <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight px-4">
            SCAN {targetName}
          </h2>
          <div className="h-1 w-10 bg-orange-500 rounded-full mt-1"></div>
        </div>

        {/* CAMERA AREA - DIBUAT FLEX-1 AGAR MENYESUAIKAN SISA LAYAR */}
        <div className="relative flex-1 overflow-hidden bg-black">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Overlay Box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-10">
            <div className="w-full max-w-[250px] aspect-square border-2 border-blue-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
          </div>

          {/* Upload Button */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <label className="w-14 h-14 bg-white/90 rounded-2xl flex items-center justify-center shadow-xl cursor-pointer active:scale-90 transition-all">
              <input type="file" hidden onChange={handleFileUpload} />
              <RiImageAddFill className="text-3xl text-slate-800" />
            </label>
          </div>
        </div>

        {/* STATUS FOOTER - TINGGI FIX AGAR TIDAK KEPOTONG */}
        <div className={`flex-shrink-0 p-5 ${info.color} text-white text-center transition-colors duration-500`}>
          <p className="font-black text-lg uppercase truncate leading-tight mb-1">{info.nama}</p>
          <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase">
            {info.status}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl border-t-[12px] border-current ${popupTheme.text}`}>
            <div className="text-6xl mb-4">{popupTheme.icon}</div>
            <h2 className="text-2xl font-black mb-2 uppercase">{info.status}</h2>
            <p className="text-slate-600 font-bold mb-8 leading-tight uppercase">{info.nama}</p>
            <button
              onClick={handleContinueScan}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all ${popupTheme.bg}`}
            >
              OK, LANJUT SCAN
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #reader { border: none !important; }
      `}</style>
    </div>
  );
}