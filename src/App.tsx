import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { 
  Package, 
  Sparkles, 
  ArrowUpDown, 
  Search, 
  Lock, 
  Info,
  PhoneCall
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, Order } from './types/store';
import { SEED_PRODUCTS } from './data/seedData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { StoreHeader } from './components/StoreHeader';
import { CategorySelection } from './components/CategorySelection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { EditProductModal } from './components/EditProductModal';
import { InventoryManager } from './components/InventoryManager';
import { OrderManager } from './components/OrderManager';
import { CartDrawer } from './components/CartDrawer';
import { STORE_PHONE_DISPLAY, STORE_LOGO_URL } from './utils/format';

function MainShop() {
  const { user, isAdmin, loginWithGoogle } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'inventory' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Umum');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name-asc'>('default');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSeedingInitial, setIsSeedingInitial] = useState(false);

  // Modals
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  // 1. Subscribe to Products
  useEffect(() => {
    const q = collection(db, 'products');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            description: data.description || '',
            category: data.category || 'Umum',
            price: Number(data.price) || 0,
            wholesalePrice: Number(data.wholesalePrice) || 0,
            minWholesaleQty: Number(data.minWholesaleQty) || 1,
            stock: Number(data.stock) || 0,
            unit: data.unit || 'pcs',
            imageUrl: data.imageUrl || '',
            sku: data.sku || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        setProducts(list);
        setLoadingProducts(false);
      },
      (error) => {
        console.error('Products onSnapshot error:', error);
        handleFirestoreError(error, OperationType.LIST, 'products');
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Orders (When Admin is logged in)
  useEffect(() => {
    if (!isAdmin) {
      setOrders([]);
      return;
    }

    const q = collection(db, 'orders');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          orderList.push({
            id: docSnap.id,
            customerName: data.customerName || 'Pelanggan',
            customerPhone: data.customerPhone || '',
            customerAddress: data.customerAddress || '',
            notes: data.notes || '',
            userId: data.userId || 'guest',
            items: data.items || [],
            totalAmount: Number(data.totalAmount) || 0,
            totalSaved: Number(data.totalSaved) || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });

        orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(orderList);
      },
      (error) => {
        console.warn('Orders onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Seed default items into Firestore
  const handleSeedInitialCatalog = async () => {
    setIsSeedingInitial(true);
    try {
      const batch = writeBatch(db);
      SEED_PRODUCTS.forEach((item) => {
        const newRef = doc(collection(db, 'products'));
        batch.set(newRef, {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error seeding initial catalog:', err);
      if (!isAdmin) {
        alert('Fitur ini hanya dapat digunakan oleh pengelola toko.');
      } else {
        handleFirestoreError(err, OperationType.CREATE, 'products');
      }
    } finally {
      setIsSeedingInitial(false);
    }
  };

  // Filter & Sort Products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Umum' ||
      selectedCategory === 'Semua Kategori' ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Sort
  filteredProducts.sort((a, b) => {
    if (sortBy === 'price-asc') return a.wholesalePrice - b.wholesalePrice;
    if (sortBy === 'price-desc') return b.wholesalePrice - a.wholesalePrice;
    if (sortBy === 'stock-desc') return b.stock - a.stock;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#0066ff] selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* CATALOG VIEW */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Store Promo Banner */}
            <StoreHeader />

            {/* Kategori Pilihan (Bright & Crisp matching Reference) */}
            <CategorySelection
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              products={products}
            />

            {/* Empty Catalog Prompter */}
            {!loadingProducts && products.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0066ff] flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Katalog MidwayMart Sedang Dipersiapkan
                </h3>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  {isAdmin 
                    ? 'Klik tombol di bawah untuk langsung mengisi 14 produk sembako grosir standar sesuai kategori pilihan.'
                    : 'Barang sedang diperbarui oleh toko. Silakan hubungi WhatsApp kami untuk pemesanan langsung.'}
                </p>

                {isAdmin ? (
                  <button
                    onClick={handleSeedInitialCatalog}
                    disabled={isSeedingInitial}
                    className="bg-[#0066ff] hover:bg-[#0055ff] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSeedingInitial ? 'Memuat...' : 'Muat 14 Produk Grosir Bawaan'}</span>
                  </button>
                ) : (
                  <a
                    href="https://wa.me/6281914886596"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Hubungi WA ({STORE_PHONE_DISPLAY})</span>
                  </a>
                )}
              </div>
            )}

            {/* Products Section */}
            {products.length > 0 && (
              <div className="space-y-4">
                {/* Sub-Header / Sort Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>Daftar Barang: {selectedCategory}</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({filteredProducts.length} item)
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      Urutkan:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-[#0066ff] shadow-xs"
                    >
                      <option value="default">Paling Populer</option>
                      <option value="price-asc">Harga Grosir: Termurah</option>
                      <option value="price-desc">Harga Grosir: Tertinggi</option>
                      <option value="stock-desc">Stok Terbanyak</option>
                      <option value="name-asc">Nama Produk (A - Z)</option>
                    </select>
                  </div>
                </div>

                {/* Products Grid */}
                {loadingProducts ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <div
                        key={n}
                        className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3"
                      >
                        <div className="aspect-4/3 bg-slate-200 rounded-xl" />
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-6 bg-slate-200 rounded w-1/2" />
                        <div className="h-8 bg-slate-200 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900 text-sm mb-1">
                      Belum ada produk di kategori "{selectedCategory}"
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {searchQuery
                        ? `Tidak ditemukan barang dengan kata kunci "${searchQuery}".`
                        : 'Pilih kategori lain atau klik "Umum" untuk melihat seluruh katalog.'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Umum');
                      }}
                      className="px-4 py-2 bg-[#0066ff] hover:bg-[#0055ff] text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Tampilkan Semua (Umum)
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelectProduct={(p) => setSelectedProductForDetail(p)}
                        onEditProduct={(p) => setSelectedProductForEdit(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wholesale Info & FAQs */}
            <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#0066ff]" />
                Keuntungan Kulakan di MidwayMart
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#0066ff] text-white flex items-center justify-center font-black text-xs">
                      1
                    </span>
                    Harga Pabrik Grosir
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Setiap barang memiliki harga grosir resmi. Cukup penuhi minimal pembelian untuk menikmati margin keuntungan lebih besar.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#0066ff] text-white flex items-center justify-center font-black text-xs">
                      2
                    </span>
                    Nota Cepat via WhatsApp
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Pesan melalui keranjang online kami, dan nota transaksi otomatis dikirim langsung ke WhatsApp toko untuk konfirmasi instan.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#0066ff] text-white flex items-center justify-center font-black text-xs">
                      3
                    </span>
                    Siap Antar Warung & Toko
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Melayani pengiriman rutin untuk warung makan, toko kelontong, kafe, dan agen pengecer dengan stok selalu terjaga.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY VIEW (Admin Only) */}
        {activeTab === 'inventory' && (
          <div>
            {isAdmin ? (
              <InventoryManager
                products={products}
                onOpenEditModal={(p) => setSelectedProductForEdit(p)}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-sm mx-auto my-12 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066ff] flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  Akses Khusus Pengelola
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Silakan masuk menggunakan akun pengelola MidwayMart yang telah terdaftar.
                </p>
                <button
                  onClick={loginWithGoogle}
                  className="bg-[#0066ff] hover:bg-[#0055ff] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  Masuk Akun Pengelola
                </button>
              </div>
            )}
          </div>
        )}

        {/* ORDER VIEW (Admin Only) */}
        {activeTab === 'orders' && (
          <div>
            {isAdmin ? (
              <OrderManager orders={orders} />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-sm mx-auto my-12 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066ff] flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  Pesanan Masuk
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Hanya pengelola toko yang dapat mengakses daftar transaksi pesanan masuk.
                </p>
                <button
                  onClick={loginWithGoogle}
                  className="bg-[#0066ff] hover:bg-[#0055ff] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  Masuk Akun Pengelola
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-600 text-xs py-8 mt-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-slate-300">
                <img src={STORE_LOGO_URL} alt="MidwayMart" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm tracking-wider">MIDWAYMART</p>
                <p className="text-[10px] text-slate-500">Pusat Belanja Grosir Sembako & Barang Toko Kelontong</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px]">
              <span className="text-[#0066ff] font-semibold">📞 WA: {STORE_PHONE_DISPLAY}</span>
              <span>•</span>
              <span>📍 Pengiriman Cepat & Siap Antar</span>
              <span>•</span>
              <span>⚡ Kualitas Terjamin</span>
            </div>

            <div className="text-[11px] text-slate-400">
              {!user ? (
                <button
                  onClick={loginWithGoogle}
                  className="hover:text-slate-700 transition-colors cursor-pointer text-[10px]"
                >
                  Staff Portal
                </button>
              ) : (
                <span className="text-[10px] text-[#0066ff] font-medium">
                  {isAdmin ? 'Pengelola Terhubung' : 'Akun Terhubung'}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onEditProduct={(p) => {
          setSelectedProductForDetail(null);
          setSelectedProductForEdit(p);
        }}
      />

      <EditProductModal
        product={selectedProductForEdit}
        onClose={() => setSelectedProductForEdit(null)}
      />

      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainShop />
      </CartProvider>
    </AuthProvider>
  );
}
