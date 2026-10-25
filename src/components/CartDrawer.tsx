import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Send, 
  CheckCircle, 
  TrendingDown,
  User,
  MapPin,
  FileText
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatRupiah, createWhatsAppMessage, STORE_PHONE_WA, STORE_LOGO_URL, getAuthenticProductImage } from '../utils/format';
import { OrderItem } from '../types/store';

export const CartDrawer: React.FC = () => {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    totalItemsCount, 
    totalAmount, 
    totalSaved,
    isCartOpen, 
    setIsCartOpen 
  } = useCart();
  
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<{ id: string } | null>(null);

  if (!isCartOpen) return null;

  const orderItems: OrderItem[] = items.map((item) => {
    const isWholesale = item.quantity >= item.product.minWholesaleQty;
    const priceApplied = isWholesale ? item.product.wholesalePrice : item.product.price;
    return {
      productId: item.product.id,
      name: item.product.name,
      unit: item.product.unit,
      quantity: item.quantity,
      priceApplied,
      isWholesale,
      subtotal: priceApplied * item.quantity,
    };
  });

  const handleOrderSubmit = async (sendToWhatsApp: boolean = false) => {
    if (!customerName.trim()) {
      alert('Mohon masukkan Nama Anda atau Nama Toko / Warung.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Mohon masukkan Nomor WhatsApp atau HP Anda.');
      return;
    }
    if (items.length === 0) {
      alert('Keranjang belanja grosir masih kosong.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || '-',
        notes: notes.trim() || '-',
        userId: user ? user.uid : 'guest',
        items: orderItems,
        totalAmount,
        totalSaved,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const newOrderId = docRef.id;

      if (sendToWhatsApp) {
        const waMsg = createWhatsAppMessage({
          orderId: newOrderId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          notes: notes.trim(),
          items: orderItems,
          totalAmount,
          totalSaved,
        });

        const waUrl = `https://wa.me/${STORE_PHONE_WA}?text=${waMsg}`;
        window.open(waUrl, '_blank');
      }

      setOrderCompleted({ id: newOrderId });
      clearCart();
    } catch (err) {
      console.error('Error submitting order to Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'orders');
      } catch (e: any) {
        alert('Gagal mengirim pesanan: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-lg bg-white text-slate-800 h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cart Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-slate-700">
              <img src={STORE_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-black text-base text-white tracking-wide">
                Keranjang MidwayMart
              </h2>
              <p className="text-[10px] text-slate-400">
                {totalItemsCount > 0 ? `${totalItemsCount} item terpilih` : 'Belum ada barang'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderCompleted ? (
          /* Order Completed Screen */
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Pesanan Grosir Berhasil Dibuat!
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4 bg-slate-100 px-3 py-1 rounded-md">
              No. Nota: #{orderCompleted.id.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-slate-600 max-w-sm mb-6 leading-relaxed">
              Pesanan Anda telah dicatat di sistem MidwayMart. Tim kami akan segera menyiapkan pasokan barang Anda.
            </p>
            <button
              onClick={() => {
                setOrderCompleted(null);
                setIsCartOpen(false);
              }}
              className="w-full max-w-xs py-2.5 bg-[#0066ff] hover:bg-[#0055ff] text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              Kembali ke Katalog
            </button>
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart */
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Keranjang Grosir Kosong
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Jelajahi produk grosir MidwayMart dan tambahkan barang untuk mendapatkan harga termurah!
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="px-4 py-2 bg-[#0066ff] hover:bg-[#0055ff] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Lihat Katalog Produk
            </button>
          </div>
        ) : (
          /* Cart Items & Checkout */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Savings Banner */}
            {totalSaved > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 text-xs">
                <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Selamat! Anda hemat <strong>{formatRupiah(totalSaved)}</strong> dengan harga grosir kuantiti!
                </span>
              </div>
            )}

            {/* List of items */}
            <div className="space-y-3">
              {items.map((item) => {
                const isWholesale = item.quantity >= item.product.minWholesaleQty;
                const priceApplied = isWholesale ? item.product.wholesalePrice : item.product.price;
                const subtotal = priceApplied * item.quantity;
                const neededForWholesale = item.product.minWholesaleQty - item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex gap-3">
                      <img
                        src={getAuthenticProductImage(item.product.name, item.product.imageUrl)}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/products/indomie_dus.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-600 p-0.5"
                            title="Hapus barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-[#0066ff]">
                            {formatRupiah(priceApplied)}
                            <span className="text-[10px] font-normal text-slate-500"> /{item.product.unit}</span>
                          </span>
                          {isWholesale ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded">
                              Grosir
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Eceran
                            </span>
                          )}
                        </div>

                        {!isWholesale && neededForWholesale > 0 && (
                          <p className="text-[10px] text-blue-600 mt-0.5 font-medium">
                            Beli {neededForWholesale} {item.product.unit} lagi untuk harga grosir {formatRupiah(item.product.wholesalePrice)}!
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                          {/* Stepper */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900">
                              {formatRupiah(subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customer Details Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0066ff]" />
                Informasi Pemesan Grosir:
              </h4>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Nama Anda / Toko / Warung <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Budi (Warung Berkah)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Nomor WhatsApp / HP Aktif <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081914886596"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Alamat Kirim / Patokan Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Alamat toko/warung atau opsi ambil di tempat"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kirim sebelum siang / kardus jangan ditumpuk berat"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066ff]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Total & Order Action Bar */}
        {!orderCompleted && items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Barang:</span>
                <span>{totalItemsCount} item ({items.length} macam)</span>
              </div>
              {totalSaved > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Potongan Grosir:</span>
                  <span>- {formatRupiah(totalSaved)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Tagihan:</span>
                <span className="text-[#0066ff]">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {/* Dual CTA buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOrderSubmit(true)}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pesan via WhatsApp</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOrderSubmit(false)}
                className="py-2.5 px-3 bg-[#0066ff] hover:bg-[#0055ff] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Memproses...' : 'Simpan Pesanan'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
