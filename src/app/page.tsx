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

  const scannerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";

    const getFriendlyName = (slug) => {
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

  const startCamera = async (s) => {
    if (!scannerRef.current) return;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera =
          devices.find((d) =>
            d.label.toLowerCase().includes("back")
          ) || devices[devices.length - 1];

        const qrConfig = { fps: 20, qrbox: { width: 200, height: 200 } };

        await scannerRef.current.start(
          backCamera.id,
          qrConfig,
          (decodedText) => handleScanData(decodedText, s)
        );

        setInfo({
          status: "SIAP SCAN",
          nama: "Arahkan ke QR Code",
          color: "bg-slate-800",
        });
      }
    } catch {
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
        setInfo({
          status: "DUPLIKAT",
          nama: result.nama + " (Sudah Absen)",
          color: "bg-orange-500",
        });
        setPopupTheme({ text: "text-orange-500", bg: "bg-orange-500", icon: "⚠️" });
      } else {
        setInfo({
          status: "TIDAK VALID",
          nama: "ID Tidak Terdaftar",
          color: "bg-red-600",
        });
        setPopupTheme({ text: "text-red-600", bg: "bg-red-600", icon: "❌" });
      }

      setShowPopup(true);
    } catch {
      setInfo({
        status: "ERROR",
        nama: "Koneksi Bermasalah",
        color: "bg-red-800",
      });
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const s = params.get("s") || "registrasi_ulang";

    try {
      setInfo({ status: "MENYIAPKAN...", nama: "Mohon Tunggu", color: "bg-blue-600" });
      await stopCamera();
      await new Promise((r) => setTimeout(r, 300));
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
    <div className="fixed inset-0 bg-black font-sans">

      {/* CAMERA */}
      <div id="reader" className="absolute inset-0 z-0"></div>

      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full px-4 pb-6 pt-[calc(env(safe-area-inset-top)+16px)] bg-gradient-to-b from-white/90 to-transparent z-20 text-center">
        <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
          SISTEM SCANNER
        </p>
        <h2 className="text-xl font-black text-blue-900 uppercase">
          SCAN {targetName}
        </h2>
        <div className="h-1 w-12 bg-orange-500 rounded-full mt-2 mx-auto"></div>
      </div>

      {/* CENTER */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
        <div className="w-full max-w-[240px] aspect-square border-2 border-blue-400 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 left-0 w-full pt-10 pb-[calc(env(safe-area-inset-bottom)+20px)] bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-20 flex flex-col items-center">

        <label className="mb-6 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer active:scale-90">
          <input type="file" hidden onChange={handleFileUpload} />
          <RiImageAddFill className="text-3xl text-slate-800" />
        </label>

        <p className="font-black text-xl text-white uppercase">
          {info.nama}
        </p>

        <div className={`mt-1 px-4 py-1.5 ${info.color} rounded-full text-xs font-bold`}>
          {info.status}
        </div>
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-3xl p-8 w-full max-w-sm text-center border-t-8 ${popupTheme.text}`}>
            <div className="text-6xl mb-4">{popupTheme.icon}</div>
            <h2 className="text-xl font-black">{info.status}</h2>
            <p className="mb-6">{info.nama}</p>
            <button
              onClick={handleContinueScan}
              className={`w-full py-3 rounded-xl text-white ${popupTheme.bg}`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* VIDEO FIX */}
      <style jsx global>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
    </div>
  );
}