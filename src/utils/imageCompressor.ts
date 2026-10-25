/**
 * Image compressor utility for product uploads.
 * Scales down large camera / high-res images to max 800x800 px and compresses to JPEG
 * so images can be stored directly and reliably inside Firestore documents (<100KB).
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  fileName: string;
}

export const compressImageFile = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar yang valid (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal menginisialisasi canvas untuk kompresi gambar.'));
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG dataURL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate approximate size in KB
        const head = 'data:image/jpeg;base64,';
        const base64Length = compressedDataUrl.length - head.length;
        const compressedSizeBytes = Math.round((base64Length * 3) / 4);
        const compressedSizeKb = Math.round(compressedSizeBytes / 1024);
        const originalSizeKb = Math.round(file.size / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeKb,
          compressedSizeKb,
          width,
          height,
          fileName: file.name,
        });
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses file gambar. Silakan coba file lain.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari perangkat.'));
    };

    reader.readAsDataURL(file);
  });
};
