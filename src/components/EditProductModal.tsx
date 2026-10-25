import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { Product } from '../types/store';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PRESET_IMAGE_SUGGESTIONS, getAuthenticProductImage } from '../utils/format';
import { INITIAL_CATEGORIES } from '../data/seedData';
import { ImageUploader } from './ImageUploader';

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category || 'Beras');
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState<number>(product.price || 0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(product.wholesalePrice || 0);
  const [minWholesaleQty, setMinWholesaleQty] = useState<number>(product.minWholesaleQty || 1);
  const [stock, setStock] = useState<number>(product.stock || 0);
  const [unit, setUnit] = useState(product.unit || 'pcs');
  const [sku, setSku] = useState(product.sku || '');
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category || 'Beras');
      setDescription(product.description || '');
      setPrice(product.price || 0);
      setWholesalePrice(product.wholesalePrice || 0);
      setMinWholesaleQty(product.minWholesaleQty || 1);
      setStock(product.stock || 0);
      setUnit(product.unit || 'pcs');
      setSku(product.sku || '');
      setImageUrl(getAuthenticProductImage(product.name, product.imageUrl));
    }
  }, [product]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }
    if (wholesalePrice < 0 || stock < 0) {
      alert('Harga dan stok harus bernilai positif!');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedData = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        wholesalePrice: Number(wholesalePrice),
        minWholesaleQty: Number(minWholesaleQty) || 1,
        stock: Number(stock),
        unit: unit.trim() || 'pcs',
        sku: sku.trim(),
        imageUrl: imageUrl.trim() || PRESET_IMAGE_SUGGESTIONS[0].url,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'products', product.id), updatedData);
      onClose();
    } catch (err) {
      console.error('Error updating product:', err);
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0066ff] text-white flex items-center justify-center shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Edit Data Produk MidwayMart</h3>
              <p className="text-[10px] text-slate-500">Pembaruan langsung tersinkronisasi ke katalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:bg-white focus:outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                value={sku}
                onChange={(e) => setSku(e.target.value)}
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
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(Number(e.target.value))}
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
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
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
                value={minWholesaleQty}
                onChange={(e) => setMinWholesaleQty(Number(e.target.value))}
                className="w-full text-xs font-bold bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Stok Gudang <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
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
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          </div>

          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            productName={name}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi Produk
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0066ff] hover:bg-[#0055ff] disabled:bg-slate-300 rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
