import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  X,
  DollarSign
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { Product } from '../types/store';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatRupiah, PRESET_IMAGE_SUGGESTIONS, getAuthenticProductImage } from '../utils/format';
import { SEED_PRODUCTS, INITIAL_CATEGORIES } from '../data/seedData';
import { useAuth } from '../context/AuthContext';
import { ImageUploader } from './ImageUploader';

interface InventoryManagerProps {
  products: Product[];
  onOpenEditModal: (product: Product) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onOpenEditModal,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncingPhotos, setIsSyncingPhotos] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Beras');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(20000);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(18000);
  const [formMinWholesaleQty, setFormMinWholesaleQty] = useState<number>(5);
  const [formStock, setFormStock] = useState<number>(50);
  const [formUnit, setFormUnit] = useState('pcs');
  const [formSku, setFormSku] = useState('');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_IMAGE_SUGGESTIONS[0].url);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'Semua' || p.category === filterCategory;

    let matchesStock = true;
    if (filterStockStatus === 'low') {
      matchesStock = p.stock > 0 && p.stock <= 10;
    } else if (filterStockStatus === 'out') {
      matchesStock = p.stock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalItemsCount = products.length;
  const totalPhysicalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalWholesaleValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.wholesalePrice || 0), 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }
    if (formWholesalePrice < 0 || formStock < 0) {
      alert('Harga dan stok harus bernilai positif!');
      return;
    }

    setIsSubmitting(true);
    try {
      const newProductData = {
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        price: Number(formPrice) || Number(formWholesalePrice),
        wholesalePrice: Number(formWholesalePrice),
        minWholesaleQty: Number(formMinWholesaleQty) || 1,
        stock: Number(formStock),
        unit: formUnit.trim() || 'pcs',
        sku: formSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        imageUrl: formImageUrl.trim() || PRESET_IMAGE_SUGGESTIONS[0].url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'products'), newProductData);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error creating product:', err);
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormCategory('Beras');
    setFormPrice(20000);
    setFormWholesalePrice(18000);
    setFormMinWholesaleQty(5);
    setFormStock(50);
    setFormUnit('pcs');
    setFormSku('');
    setFormImageUrl(PRESET_IMAGE_SUGGESTIONS[0].url);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${productName}" dari inventaris MidwayMart?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    try {
      await updateDoc(doc(db, 'products', product.id), {
        stock: newStock,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error adjusting stock:', err);
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const handleSeedProducts = async () => {
    if (products.length > 0 && !window.confirm('Katalog sudah memiliki data. Tetap ingin memuat produk grosir bawaan?')) {
      return;
    }

    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      SEED_PRODUCTS.forEach((item) => {
        const newDocRef = doc(collection(db, 'products'));
        batch.set(newDocRef, {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      alert('Berhasil memuat data produk grosir awal!');
    } catch (err) {
      console.error('Error seeding data:', err);
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncRealPhotos = async () => {
    if (products.length === 0) return;
    setIsSyncingPhotos(true);
    try {
      const batch = writeBatch(db);
      let count = 0;
      products.forEach((p) => {
        const authenticUrl = getAuthenticProductImage(p.name, p.imageUrl);
        if (p.imageUrl !== authenticUrl) {
          batch.update(doc(db, 'products', p.id), {
            imageUrl: authenticUrl,
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        alert(`Berhasil menyinkronkan foto asli untuk ${count} produk ke database!`);
      } else {
        alert('Semua produk di database sudah menggunakan foto asli.');
      }
    } catch (err) {
      console.error('Error syncing authentic photos:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'products');
    } finally {
      setIsSyncingPhotos(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Manajemen Inventaris & Produk MidwayMart
            </h2>
            <span className="bg-blue-50 text-[#0066ff] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Hak Akses Pemilik
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tambah, perbarui harga grosir, ubah kuantiti minimal, dan sesuaikan stok barang gudang Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncRealPhotos}
            disabled={isSyncingPhotos}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Perbarui database dengan foto asli barang fisik"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSyncingPhotos ? 'Menyinkronkan...' : 'Sinkron Foto Asli'}</span>
          </button>

          {products.length === 0 && (
            <button
              onClick={handleSeedProducts}
              disabled={isSeeding}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSeeding ? 'Memuat...' : 'Muat Data Grosir Standar'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#0066ff] hover:bg-[#0055ff] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Inventory Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Produk</span>
            <Package className="w-4 h-4 text-[#0066ff]" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalItemsCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Item aktif di katalog</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Stok Fisik</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalPhysicalStock}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unit barang di gudang</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Nilai Aset Grosir</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 truncate">
            {formatRupiah(totalWholesaleValue)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Estimasi modal grosir</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Perlu Restock</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600">
            {lowStockCount + outOfStockCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {outOfStockCount > 0 ? `${outOfStockCount} habis, ` : ''}{lowStockCount} menipis
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, SKU, atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-[#0066ff]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#0066ff]"
          >
            <option value="Semua">Semua Kategori</option>
            {INITIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs border border-slate-200">
            <button
              onClick={() => setFilterStockStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterStockStatus === 'all' ? 'bg-[#0066ff] text-white font-bold' : 'text-slate-600'
              }`}
            >
              Semua ({products.length})
            </button>
            <button
              onClick={() => setFilterStockStatus('low')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterStockStatus === 'low' ? 'bg-[#0066ff] text-white font-bold' : 'text-slate-600'
              }`}
            >
              Menipis ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterStockStatus('out')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterStockStatus === 'out' ? 'bg-red-600 text-white font-bold' : 'text-slate-600'
              }`}
            >
              Habis ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">Tidak ada produk yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau tambah produk baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Grosir</th>
                  <th className="py-3 px-4">Harga Eceran</th>
                  <th className="py-3 px-4">Min. Grosir</th>
                  <th className="py-3 px-4">Stok Gudang</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= 10;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getAuthenticProductImage(p.name, p.imageUrl)}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/products/indomie_dus.jpg';
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {p.sku || 'No SKU'} • {p.unit}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px] border border-slate-200">
                          {p.category || 'Umum'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-[#0066ff]">
                        {formatRupiah(p.wholesalePrice)}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {p.price ? formatRupiah(p.price) : '-'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {p.minWholesaleQty || 1}
                        </span>{' '}
                        <span className="text-slate-500">{p.unit}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isOut
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isLow
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuickStockAdjust(p, -5)}
                              title="Kurangi 5 stok"
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleQuickStockAdjust(p, -1)}
                              title="Kurangi 1 stok"
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleQuickStockAdjust(p, +1)}
                              title="Tambah 1 stok"
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleQuickStockAdjust(p, +10)}
                              title="Tambah 10 stok (1 dus)"
                              className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#0066ff] border border-blue-200 rounded text-[10px] font-bold font-mono"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditModal(p)}
                            title="Edit data produk"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066ff] rounded-lg transition-colors border border-blue-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Hapus produk"
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0066ff] text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg text-slate-900">Tambah Produk Grosir MidwayMart</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk Grosir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Minyak Goreng Tropical 2 Liter"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:outline-none"
                  >
                    {INITIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU / Kode Barang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: MYK-TRP-2L"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50/70 rounded-2xl border border-blue-200">
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    Harga Grosir (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={formWholesalePrice}
                    onChange={(e) => setFormWholesalePrice(Number(e.target.value))}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Harga Eceran (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Min. Qty Grosir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formMinWholesaleQty}
                    onChange={(e) => setFormMinWholesaleQty(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Stok Tersedia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan Barang (Unit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: dus, pcs, renceng, karung 5kg"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:outline-none"
                  />
                </div>
              </div>

              <ImageUploader
                value={formImageUrl}
                onChange={setFormImageUrl}
                productName={formName}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan pasokan grosir atau isi kemasan..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0066ff] hover:bg-[#0055ff] disabled:bg-slate-300 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Produk Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
