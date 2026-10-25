import React, { useState } from 'react';
import { 
  ShoppingCart, 
  ShieldCheck, 
  Package, 
  ClipboardList, 
  LogOut, 
  Search,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatRupiah, STORE_PHONE_DISPLAY, STORE_LOGO_URL } from '../utils/format';

interface NavbarProps {
  activeTab: 'catalog' | 'inventory' | 'orders';
  setActiveTab: (tab: 'catalog' | 'inventory' | 'orders') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const { totalItemsCount, totalAmount, setIsCartOpen } = useCart();
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        {/* Top Info Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 text-slate-300 text-xs py-1.5 px-4 font-medium">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#0066ff] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-xs">
                GROSIR RESMI
              </span>
              <span className="text-slate-200 text-[11px] sm:text-xs">
                Pasokan Langsung Pabrik • Harga Grosir & Eceran Terlengkap
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 text-[#66b3ff]">
                📞 WA: <strong className="text-white">{STORE_PHONE_DISPLAY}</strong>
              </span>
              <span className="hidden md:inline text-slate-600">•</span>
              <span className="hidden md:inline text-slate-300">Buka: 07.00 - 18.00 WIB</span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Brand Logo & Name */}
            <div 
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black border border-slate-300 shadow-sm group-hover:border-[#0066ff] transition-all">
                <img
                  src={STORE_LOGO_URL}
                  alt="MidwayMart Logo"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-wider text-slate-900 group-hover:text-[#0066ff] transition-colors">
                    MIDWAY<span className="text-[#0066ff]">MART</span>
                  </span>
                  <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-extrabold px-1.5 py-0.2 rounded tracking-widest uppercase">
                    GROSIR
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 tracking-wide font-medium">
                  Pusat Sembako, Makanan & Kebutuhan Warung
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari barang grosir (minyak, beras, mie, kopi, sabun)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-2.5">
              {/* Admin Tabs - ONLY shown if authenticated as Admin */}
              {isAdmin && (
                <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'catalog'
                        ? 'bg-[#0066ff] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Katalog
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'inventory'
                        ? 'bg-[#0066ff] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Kelola Stok
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'orders'
                        ? 'bg-[#0066ff] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Pesanan
                  </button>
                </div>
              )}

              {/* Wholesale Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-[#0066ff] hover:bg-[#0055ff] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:scale-102 active:scale-98"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Keranjang</span>
                {totalItemsCount > 0 && (
                  <span className="bg-[#e60026] text-white font-black text-[11px] px-2 py-0.2 rounded-full shadow-xs">
                    {totalItemsCount}
                  </span>
                )}
                {totalAmount > 0 && (
                  <span className="hidden xl:inline text-blue-100 text-xs font-semibold border-l border-blue-400/40 pl-2">
                    {formatRupiah(totalAmount)}
                  </span>
                )}
              </button>

              {/* Subtle Auth Area */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}

                    {isAdmin && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3 text-[#0066ff]" />
                        Admin
                      </span>
                    )}
                  </div>

                  <button
                    onClick={logout}
                    title="Keluar"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Discreet lock button */
                <button
                  onClick={() => setShowAdminLoginModal(true)}
                  title="Panel Pengelola Toko"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search & Mobile Admin Navigation */}
          <div className="mt-2.5 md:hidden flex flex-col gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk grosir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-900 rounded-lg focus:outline-none focus:border-[#0066ff]"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-center ${
                    activeTab === 'catalog' ? 'bg-[#0066ff] text-white' : 'text-slate-600'
                  }`}
                >
                  Katalog
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-center ${
                    activeTab === 'inventory' ? 'bg-[#0066ff] text-white' : 'text-slate-600'
                  }`}
                >
                  Kelola Stok
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 py-1 px-2 rounded font-bold text-center ${
                    activeTab === 'orders' ? 'bg-[#0066ff] text-white' : 'text-slate-600'
                  }`}
                >
                  Pesanan
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Discrete Owner Login Modal */}
      {showAdminLoginModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAdminLoginModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066ff] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Akses Pengelola Toko
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Masuk dengan akun Google terdaftar untuk mengedit produk, harga grosir, dan inventaris MidwayMart.
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowAdminLoginModal(false);
                  await loginWithGoogle();
                }}
                className="w-full py-2.5 px-4 bg-[#0066ff] hover:bg-[#0055ff] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Masuk dengan Akun Google</span>
              </button>
              <button
                onClick={() => setShowAdminLoginModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
