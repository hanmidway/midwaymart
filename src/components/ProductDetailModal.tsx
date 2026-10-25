import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Check, 
  Package, 
  Tag, 
  Plus, 
  Minus,
  Edit3
} from 'lucide-react';
import { Product } from '../types/store';
import { formatRupiah, getAuthenticProductImage } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onEditProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onEditProduct,
}) => {
  if (!product) return null;

  const { addToCart, items } = useCart();
  const { isAdmin } = useAuth();
  const [quantity, setQuantity] = useState<number>(product.minWholesaleQty || 1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const cartItem = items.find((i) => i.product.id === product.id);
  const currentCartQty = cartItem?.quantity || 0;

  const isWholesaleActive = quantity >= product.minWholesaleQty;
  const currentUnitPrice = isWholesaleActive ? product.wholesalePrice : product.price;
  const currentTotal = currentUnitPrice * quantity;
  const normalTotal = product.price * quantity;
  const totalSavings = normalTotal - currentTotal;

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const authenticImageUrl = getAuthenticProductImage(product.name, product.imageUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-auto bg-slate-100">
            <img
              src={authenticImageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/products/indomie_dus.jpg';
              }}
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-lg">
              Kategori: {product.category || 'Umum'}
            </div>
          </div>

          {/* Details & Tier Calculation */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              {/* SKU & Admin edit */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-slate-400">
                  {product.sku ? `SKU: ${product.sku}` : 'PRODUK GROSIR MIDWAYMART'}
                </span>
                {isAdmin && onEditProduct && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditProduct(product);
                    }}
                    className="text-xs text-[#0066ff] hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Produk
                  </button>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 leading-snug mb-3">
                {product.name}
              </h2>

              {/* Price comparison box */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 mb-4">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#0066ff]" />
                    Harga Grosir Toko:
                  </span>
                  <span className="text-2xl font-black text-[#0066ff]">
                    {formatRupiah(product.wholesalePrice)}
                    <span className="text-xs font-normal text-slate-600"> /{product.unit}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-blue-200/60">
                  <span>
                    Min. Grosir: <strong>{product.minWholesaleQty} {product.unit}</strong>
                  </span>
                  {product.price > product.wholesalePrice && (
                    <span className="text-slate-500">
                      Eceran: <span className="line-through">{formatRupiah(product.price)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi & Spesifikasi:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto">
                  {product.description || 'Barang berkualitas grosir langsung untuk kebutuhan toko dan warung harian.'}
                </p>
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Package className="w-4 h-4 text-slate-400" />
                <span>Ketersediaan Stok:</span>
                <strong className={product.stock > 10 ? 'text-emerald-700' : 'text-orange-600'}>
                  {product.stock > 0 ? `${product.stock} ${product.unit} tersedia di gudang` : 'Stok habis'}
                </strong>
              </div>

              {/* Interactive Wholesale Simulator */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/70 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Pilih Jumlah Pembelian:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isWholesaleActive 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {isWholesaleActive ? '✓ Harga Grosir Aktif' : `Kurang ${product.minWholesaleQty - quantity} lagi utk grosir`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(product.stock || 1, v)));
                      }}
                      className="w-16 text-center text-sm font-black text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Estimasi Total:</p>
                    <p className="text-lg font-black text-slate-900">{formatRupiah(currentTotal)}</p>
                    {totalSavings > 0 && (
                      <p className="text-[11px] font-bold text-emerald-600">
                        Hemat {formatRupiah(totalSavings)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Add to Cart Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0066ff] hover:bg-[#0055ff] text-white active:scale-98 shadow-sm shadow-blue-500/20'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Berhasil Dimasukkan ke Keranjang!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Masukkan ke Keranjang ({quantity} {product.unit})</span>
                  </>
                )}
              </button>
              {currentCartQty > 0 && (
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Telah ada {currentCartQty} {product.unit} di keranjang belanja Anda
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
