import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Send, 
  CheckCircle, 
  Clock, 
  Truck, 
  XCircle, 
  MapPin, 
  FileText,
  Package
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Order, OrderStatus } from '../types/store';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatRupiah } from '../utils/format';

interface OrderManagerProps {
  orders: Order[];
}

export const OrderManager: React.FC<OrderManagerProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, customerName: string) => {
    if (!window.confirm(`Hapus data pesanan dari "${customerName}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Error deleting order:', err);
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Konfirmasi
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
            <Package className="w-3 h-3 text-[#0066ff]" />
            Sedang Disiapkan
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            Dikirim / Siap Ambil
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            Dibatalkan
          </span>
        );
    }
  };

  const createWhatsAppFollowUpUrl = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = encodeURIComponent(
      `Halo ${order.customerName}, kami dari MidwayMart Grosir.\n` +
      `Mengenai pesanan Anda No. #${order.id.slice(-6).toUpperCase()} (Total: ${formatRupiah(order.totalAmount)}):\n` +
      `Status pesanan saat ini: *${order.status.toUpperCase()}*.\n` +
      `Pesanan segera kami siapkan. Terima kasih telah kulakan di MidwayMart!`
    );
    return `https://wa.me/${waNumber}?text=${msg}`;
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Kelola Pesanan Masuk MidwayMart
            </h2>
            <span className="bg-blue-50 text-[#0066ff] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Admin Toko
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pesanan pelanggan, perbarui status order, dan kirim konfirmasi WhatsApp 1-klik.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
            <p className="text-[10px] font-bold text-amber-800 uppercase">Perlu Diproses</p>
            <p className="text-xl font-black text-amber-900">{pendingOrdersCount} Pesanan</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Nilai Pesanan</p>
            <p className="text-xl font-black text-emerald-900">{formatRupiah(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pemesan atau nomor WA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-[#0066ff]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'all' ? 'bg-[#0066ff] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-800'
            }`}
          >
            Menunggu ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'confirmed' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-800'
            }`}
          >
            Disiapkan
          </button>
          <button
            onClick={() => setStatusFilter('shipped')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'shipped' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-800'
            }`}
          >
            Dikirim
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-sm">Belum Ada Pesanan yang Sesuai</p>
          <p className="text-xs text-slate-400 mt-1">
            Pesanan dari pelanggan yang memesan lewat website akan otomatis muncul di sini secara real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066ff] flex items-center justify-center font-bold text-xs font-mono">
                    #{order.id.slice(-4).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-sm">
                        {order.customerName}
                      </h4>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Waktu pesan: {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={createWhatsAppFollowUpUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Chat WA ({order.customerPhone})
                  </a>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total Tagihan:</span>
                    <span className="text-base font-black text-[#0066ff]">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 text-xs border-b border-slate-100">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block">Alamat / Titik Antar:</span>
                    <span>{order.customerAddress || 'Ambil langsung di gudang'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-600">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block">Catatan Pembeli:</span>
                    <span>{order.notes || 'Tidak ada catatan'}</span>
                  </div>
                </div>

                <div className="flex items-center md:justify-end gap-2">
                  <span className="font-bold text-slate-700">Status:</span>
                  <select
                    disabled={updatingId === order.id}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 font-bold focus:border-[#0066ff] focus:outline-none"
                  >
                    <option value="pending">Menunggu Konfirmasi</option>
                    <option value="confirmed">Disiapkan</option>
                    <option value="shipped">Sedang Dikirim / Siap Ambil</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  Daftar Barang Pesanan ({order.items.length} Macam):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900 truncate max-w-[160px]">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} {item.unit} x {formatRupiah(item.priceApplied)}
                          {item.isWholesale && (
                            <span className="text-emerald-700 font-bold ml-1"> [Grosir]</span>
                          )}
                        </p>
                      </div>
                      <span className="font-black text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
