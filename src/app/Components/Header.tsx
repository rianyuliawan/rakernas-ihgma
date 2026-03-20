import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* SISI KIRI: Logo dan Nama Acara */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <Image
              src="/asset/image.png" // Pastikan file ada di folder public
              alt="Logo IHGMA"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-blue-900 font-black text-sm md:text-xl leading-none tracking-tight">
              RAKERNAS V IHGMA
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Lombok - NTB 2026
            </p>
          </div>
        </div>

        {/* SISI KANAN: Status Label (Hanya muncul di Layar Besar) */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              Event Management System
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-slate-700">ONLINE</span>
            </div>
          </div>
        </div>

        {/* ICON MENU / MOBILE STATUS (Muncul di HP) */}
        <div className="sm:hidden flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase">Live</span>
        </div>

      </div>
    </header>
  );
}