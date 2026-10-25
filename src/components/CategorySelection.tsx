import React from 'react';
import { CATEGORIES_LIST } from '../data/seedData';
import { Product } from '../types/store';
import { Sparkles } from 'lucide-react';

interface CategorySelectionProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  products: Product[];
}

export const CategorySelection: React.FC<CategorySelectionProps> = ({
  selectedCategory,
  onSelectCategory,
  products,
}) => {
  const getItemCount = (categoryName: string) => {
    if (categoryName === 'Umum') {
      return products.length;
    }
    return products.filter((p) => p.category === categoryName).length;
  };

  return (
    <div className="space-y-3.5 mb-6">
      {/* Section Header matching user reference */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kategori Pilihan
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 bg-blue-50 text-[#0066ff] border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#0066ff]" />
            Grosir Lengkap
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Pilih kategori untuk filter barang
        </p>
      </div>

      {/* Grid of Category Cards (Bright, Clean, Crisp like Reference Screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3">
        {CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = getItemCount(cat.name);

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 cursor-pointer text-center select-none ${
                isSelected
                  ? 'bg-blue-50/80 border-2 border-[#0066ff] shadow-md shadow-blue-500/15 scale-[1.02]'
                  : 'bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/90 shadow-xs hover:shadow-sm hover:scale-[1.01]'
              }`}
            >
              {/* Active glow tag */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0066ff] shadow-xs" />
              )}

              {/* Icon container */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 transition-transform duration-300 group-hover:scale-110 ${
                  isSelected
                    ? 'bg-blue-100/90 border border-blue-300 shadow-xs'
                    : 'bg-slate-100/80 border border-slate-200/80'
                }`}
              >
                <span className="filter drop-shadow-xs select-none">{cat.icon}</span>
              </div>

              {/* Category Name */}
              <span
                className={`text-xs font-bold transition-colors line-clamp-1 ${
                  isSelected ? 'text-[#0066ff]' : 'text-slate-800 group-hover:text-[#0066ff]'
                }`}
              >
                {cat.name}
              </span>

              {/* Subtitle / Item Count */}
              <span
                className={`text-[10px] mt-0.5 transition-colors font-medium ${
                  isSelected ? 'text-blue-700 font-bold' : 'text-slate-400'
                }`}
              >
                {count > 0 ? `${count} produk` : 'Stok siap'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
