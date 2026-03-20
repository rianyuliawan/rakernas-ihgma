"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Image from "next/image";
import { RiImageAddFill, RiFlashlightLine } from "react-icons/ri";

export default function ScannerPage() {
  const [info, setInfo] = useState({
    status: "MENCARI KAMERA...",
    nama: "Mohon Tunggu",
    color: "bg-slate-800",
  });

  const [targetName, setTargetName] = useState("REGISTRASI");
  const [flashOn, setFlashOn] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  
  // State baru untuk warna popup
  const [popupTheme, setPopupTheme] = useState({
    text: "text-green-600",
    bg: "bg-green-600",
    icon: "✅"
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";
    setTargetName(s.replace("_", " ").toUpperCase());

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    startCamera(s);

    return () => {
      stopCamera();
    };
  }, []);

  // START CAMERA
  const startCamera = (s) => {
    if (!scannerRef.current) return;

    const qrConfig = {
      fps: 20,
    };

    scannerRef.current
      .start(
        { facingMode: "environment" },
        qrConfig,
        async (decodedText) => {
          handleScanData(decodedText, s);
        }
      )
      .then(() => {
        setInfo({
          status: "SIAP SCAN",
          nama: "Arahkan ke QR Code",
          color: "bg-slate-800",
        });
      })
      .catch(() => {
        setInfo({
          status: "ERROR KAMERA",
          nama: "Izinkan Akses Kamera",
          color: "bg-red-800",
        });
      });
  };

  // STOP CAMERA
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    }
  };

  // FLASHLIGHT
  // FLASHLIGHT (VERSI FIX)
  const toggleFlash = async () => {
    try {
      // 1. Ambil elemen video yang sedang aktif di dalam ID 'reader'
      const videoElement = document.querySelector("#reader video") as HTMLVideoElement;
      
      if (!videoElement || !videoElement.srcObject) {
        alert("Kamera belum siap");
        return;
      }

      // 2. Ambil track video dari stream yang sedang berjalan
      const stream = videoElement.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      // 3. Cek apakah device mendukung senter (torch)
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn }],
        } as any);
        setFlashOn(!flashOn);
      } else {
        alert("Flash tidak didukung di perangkat ini");
      }
    } catch (err) {
      console.error("Error Flashlight:", err);
      alert("Gagal menyalakan lampu");
    }
  };

  // HANDLE SCAN
  const handleScanData = async (id, targetSheet) => {
    await stopCamera(); 

    setInfo({
      status: "MEMPROSES...",
      nama: "Mohon Tunggu",
      color: "bg-yellow-600",
    });

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL,
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

  // LANJUT SCAN
  const handleContinueScan = () => {
    setShowPopup(false);
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";
    startCamera(s); 
  };

  // UPLOAD FILE
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";

    try {
      // 1. Matikan kamera dulu agar RAM HP fokus ke file
      await stopCamera();

      setInfo({
        status: "MEMPROSES FILE...",
        nama: "Membaca QR dari gambar",
        color: "bg-blue-600",
      });

      // 2. Scan file
      const decodedText = await scannerRef.current.scanFile(file, true);
      
      // 3. Kirim ke Google Sheets
      await handleScanData(decodedText, s);

    } catch (err) {
      // Jika QR tidak terbaca di foto tersebut
      setInfo({ 
        status: "GAGAL", 
        nama: "QR Tidak Terbaca", 
        color: "bg-red-600" 
      });
      setPopupTheme({ text: "text-red-600", bg: "bg-red-600", icon: "❌" });
      setShowPopup(true);
    } finally {
      // 🔥 KUNCI UTAMA: Reset input agar file yang sama bisa di-klik lagi
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-100 flex items-center justify-center font-sans">

      <div className="w-full max-w-md h-full max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-b-[10px] border-slate-200 m-2">

        {/* HEADER */}
        <div className="flex-shrink-0 flex flex-col items-center py-6 text-center">
          <div className="relative w-24 h-12 mb-2">
          </div>
          <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">
            SCANNER {targetName}
          </h2>
          <div className="h-1 w-10 bg-orange-500 rounded-full mt-1"></div>
        </div>

        {/* CAMERA */}
        <div className="relative flex-1 overflow-hidden bg-black">
          <div id="reader" className="w-full h-full"></div>

          {/* SCAN BOX */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-60 h-60 border-2 border-blue-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
          </div>

          {/* Upload */}
          <div className="absolute bottom-6 left-6 z-20">
            <label className="w-14 h-14 bg-white/95 rounded-2xl flex items-center justify-center shadow-xl cursor-pointer active:scale-90 transition-all">
              <input type="file" hidden onChange={handleFileUpload} />
              <RiImageAddFill className="text-3xl text-slate-800" />
            </label>
          </div>

          {/* Flash */}
          <div className="absolute bottom-6 right-6 z-20">
            <button
              onClick={toggleFlash}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 ${
                flashOn ? "bg-yellow-400 text-black" : "bg-white/95 text-slate-800"
              }`}
            >
              <RiFlashlightLine className="text-3xl" />
            </button>
          </div>
        </div>

        {/* STATUS */}
        <div className={`p-6 ${info.color} text-white text-center transition-colors duration-500`}>
          <p className="font-black text-xl uppercase truncate px-2">{info.nama}</p>
          <div className="mt-1 inline-block px-3 py-0.5 bg-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase">
            {info.status}
          </div>
        </div>
      </div>

      {/* POPUP DINAMIS */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl border-t-[12px] border-current">
            <div className={`text-6xl mb-4 ${popupTheme.text}`}>
              {popupTheme.icon}
            </div>
            <h2 className={`text-2xl font-black mb-2 uppercase ${popupTheme.text}`}>
              {info.status}
            </h2>
            <p className="text-slate-600 font-bold mb-8 leading-tight uppercase">
              {info.nama}
            </p>

            <button
              onClick={handleContinueScan}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all ${popupTheme.bg}`}
            >
              OK, LANJUT SCAN
            </button>
          </div>
        </div>
      )}

      {/* FIX VIDEO FULL */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          touch-action: none;
        }
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
    </div>
  );
}