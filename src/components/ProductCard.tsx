import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Check, 
  Package, 
  Tag, 
  Plus, 
  Minus, 
  Edit3,
  TrendingDown
} from 'lucide-react';
import { Product } from '../types/store';
import { formatRupiah, getAuthenticProductImage } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onEditProduct,
}) => {
  const { addToCart, items } = useCart();
  const { isAdmin } = useAuth();
  const [qty, setQty] = useState<number>(product.minWholesaleQty || 1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const cartItem = items.find((item) => item.product.id === product.id);
  const currentCartQty = cartItem?.quantity || 0;

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock <= 0;

  const savingPerUnit = product.price > product.wholesalePrice ? product.price - product.wholesalePrice : 0;
  const savingPercentage = product.price > 0 
    ? Math.round((savingPerUnit / product.price) * 100) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, qty);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1500);
  };

  const handleQuickAddWholesale = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, product.minWholesaleQty);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1500);
  };

  const authenticImageSrc = getAuthenticProductImage(product.name, product.imageUrl);

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#0066ff] shadow-xs hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Top Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={authenticImageSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/products/indomie_dus.jpg';
          }}
        />

        {/* Category Badge */}
        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
          {product.category || 'Umum'}
        </span>

        {/* Wholesale Savings Pill in Crimson Red */}
        {savingPercentage > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-[#e60026] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Hemat {savingPercentage}%
          </span>
        )}

        {/* Admin Quick Edit Button */}
        {isAdmin && onEditProduct && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditProduct(product);
            }}
            title="Edit Produk ini"
            className="absolute bottom-2.5 right-2.5 bg-[#0066ff] hover:bg-[#0055ff] text-white p-2 rounded-xl shadow-md transition-transform hover:scale-110"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* SKU */}
          {product.sku && (
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              SKU: {product.sku}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#0066ff] transition-colors mb-2.5">
            {product.name}
          </h3>

          {/* Pricing Section (Cobalt Blue Focus) */}
          <div className="bg-blue-50/70 rounded-xl p-2.5 border border-blue-100 mb-3">
            <div className="flex items-baseline justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#0066ff]" />
                Harga Grosir:
              </span>
              <span className="text-base sm:text-lg font-black text-[#0066ff]">
                {formatRupiah(product.wholesalePrice)}
                <span className="text-xs font-normal text-slate-600"> /{product.unit}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-blue-200/50">
              <span>
                Min. order: <strong className="text-slate-800">{product.minWholesaleQty} {product.unit}</strong>
              </span>
              {product.price > product.wholesalePrice && (
                <span className="text-slate-400 line-through">
                  Eceran: {formatRupiah(product.price)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stock & Cart CTA */}
        <div>
          {/* Stock Status */}
          <div className="flex items-center justify-between text-xs mb-3 text-slate-600">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              Stok:
            </span>
            {isOutOfStock ? (
              <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-[10px]">
                Sisa {product.stock} {product.unit}
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                {product.stock} {product.unit}
              </span>
            )}
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={qty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQty(Math.max(1, Math.min(product.stock || 1, val)));
                  }}
                  className="w-12 text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Add Button (Cobalt Blue) */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isAddedRecently
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0066ff] hover:bg-[#0055ff] text-white active:scale-98 shadow-sm shadow-blue-500/20'
                }`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Masuk!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Tambah ({qty})</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick 1-Click Wholesale Pack Button */}
            {product.minWholesaleQty > 1 && qty < product.minWholesaleQty && !isOutOfStock && (
              <button
                type="button"
                onClick={handleQuickAddWholesale}
                className="w-full text-center text-[10px] font-bold text-[#0066ff] bg-blue-50 hover:bg-blue-100/80 border border-blue-200 py-1 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span>📦 Beli Paket Grosir ({product.minWholesaleQty} {product.unit})</span>
              </button>
            )}

            {currentCartQty > 0 && (
              <p className="text-[10px] text-center text-emerald-600 font-medium">
                ✓ Ada {currentCartQty} {product.unit} di keranjang
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
