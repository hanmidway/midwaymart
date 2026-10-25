import React from 'react';
import { Sparkles, ShieldCheck, Truck, Percent, Phone, Clock } from 'lucide-react';
import { STORE_PHONE_DISPLAY } from '../utils/format';

export const StoreHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#0055ff] via-[#0066ff] to-[#0044cc] text-white rounded-3xl shadow-lg shadow-blue-500/15 mb-8 p-6 md:p-8">
      {/* Background soft glow patterns */}
      <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-[#e60026]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            MidwayMart Grosir & Pasokan Toko
          </span>
          <span className="inline-flex items-center gap-1 bg-[#e60026] text-white px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs">
            <Percent className="w-3.5 h-3.5" />
            Diskon Kuantiti Otomatis
          </span>
          <span className="inline-flex items-center gap-1 bg-white/15 text-blue-50 px-2.5 py-1 rounded-full text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-200" />
            Kirim Cepat Hari Ini
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-3 text-white">
          Kulakan Grosir Lebih Cepat, <br className="hidden sm:inline" />
          Harga Pabrik di <span className="text-amber-300">MIDWAYMART</span>
        </h1>

        <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed mb-6 font-normal">
          Katalog lengkap sembako, minyak, mie instan, beras, minuman & sabun dengan harga distributor resmi. 
          Semua orang bisa cek katalog secara transparan dan pesan langsung via WhatsApp atau sistem online.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">Harga Grosir Asli</p>
              <p className="text-[10px] text-blue-100">Diskon kuantiti otomatis</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">Antar & Ambil</p>
              <p className="text-[10px] text-blue-100">Warung / ambil gudang</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">Pesan WhatsApp</p>
              <p className="text-[10px] text-blue-100">{STORE_PHONE_DISPLAY}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">Stok Terbuka</p>
              <p className="text-[10px] text-blue-100">Update selalu real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
