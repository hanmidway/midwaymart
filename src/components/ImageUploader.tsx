import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, Camera, Globe, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { compressImageFile, CompressionResult } from '../utils/imageCompressor';
import { PRESET_IMAGE_SUGGESTIONS } from '../utils/format';

interface ImageUploaderProps {
  value: string;
  onChange: (newImageUrl: string) => void;
  productName?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  productName = '',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastCompression, setLastCompression] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploadedDataUrl = value?.startsWith('data:image/');
  const isPresetUrl = value?.startsWith('/products/');

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const result = await compressImageFile(file, 800, 800, 0.82);
      setLastCompression(result);
      onChange(result.dataUrl);
    } catch (err: unknown) {
      console.error('Image compression error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleClearImage = () => {
    onChange('');
    setLastCompression(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#0066ff]" />
          <span>Foto Produk</span>
        </label>

        {/* Source Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#0066ff] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-[#0066ff] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Foto Asli Bawaan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-[#0066ff] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>URL Web</span>
          </button>
        </div>
      </div>

      {/* Main Preview Bar if Image Exists */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
            <img
              src={value}
              alt={productName || 'Preview produk'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/products/indomie_dus.jpg';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate">
                {isUploadedDataUrl
                  ? lastCompression?.fileName || 'Gambar Terunggah'
                  : isPresetUrl
                  ? value.replace('/products/', '')
                  : 'Gambar dari URL'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {isUploadedDataUrl ? 'Siap' : 'Aktif'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {isUploadedDataUrl && lastCompression ? (
                <>
                  Ukuran terkompresi: <span className="font-bold text-blue-700">{lastCompression.compressedSizeKb} KB</span> (dari {lastCompression.originalSizeKb} KB, {lastCompression.width}x{lastCompression.height}px)
                </>
              ) : isPresetUrl ? (
                'Menggunakan foto asli gudang MidwayMart'
              ) : (
                value
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearImage}
            title="Hapus foto saat ini"
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Upload from Device / Camera */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#0066ff] bg-blue-50/80 scale-[0.99]'
                : 'border-slate-300 hover:border-[#0066ff] hover:bg-slate-50/80 bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {isProcessing ? (
              <div className="py-3 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#0066ff] animate-spin" />
                <p className="text-xs font-bold text-slate-700">Mengompres & memproses foto...</p>
                <p className="text-[10px] text-slate-400">Menyesuaikan ukuran gambar untuk katalog</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066ff] flex items-center justify-center mb-2 shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Klik untuk unggah <span className="font-normal text-slate-500">atau seret foto ke sini</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format didukung: JPG, PNG, WebP (Bisa foto kamera langsung dari HP / Tablet)
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-[#0066ff] hover:bg-[#0055ff] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Pilih dari Galeri / Kamera</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Authentic Presets Grid */}
      {activeTab === 'preset' && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 font-medium">
            Pilih foto fisik asli sembako & kebutuhan grosir yang sudah disediakan:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
            {PRESET_IMAGE_SUGGESTIONS.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => {
                    onChange(preset.url);
                    setLastCompression(null);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-left text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-100 text-[#0066ff] font-bold border border-blue-400 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/products/indomie_dus.jpg';
                    }}
                  />
                  <span className="truncate leading-tight">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: URL Direct Input */}
      {activeTab === 'url' && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="url"
              value={isUploadedDataUrl ? '' : value}
              onChange={(e) => {
                onChange(e.target.value);
                setLastCompression(null);
                setErrorMsg(null);
              }}
              placeholder="https://images.unsplash.com/... atau /products/indomie_dus.jpg"
              className="flex-1 text-xs bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:border-[#0066ff] focus:bg-white focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Tempel URL gambar langsung dari internet atau path lokal.
          </p>
        </div>
      )}
    </div>
  );
};
