export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export const STORE_PHONE_DISPLAY = '0819-1488-6596';
export const STORE_PHONE_WA = '6281914886596';
export const STORE_LOGO_URL = '/assets/aistudio/file_0000000062b071f5a16788ea8690d68b__1__48369d3c.png';

export const PRESET_IMAGE_SUGGESTIONS = [
  { label: 'Beras Ramos Super 5kg', url: '/products/beras_ramos.jpg' },
  { label: 'Minyak Goreng SunCo 2L', url: '/products/minyak_goreng.jpg' },
  { label: 'Gula Pasir Gulaku 1kg', url: '/products/gula_pasir.jpg' },
  { label: 'Indomie Goreng Dus (40 pcs)', url: '/products/indomie_dus.jpg' },
  { label: 'Mie Sedaap Goreng Dus (40 pcs)', url: '/products/mie_sedaap.jpg' },
  { label: 'Bumbu Royco Rasa Ayam', url: '/products/bumbu_royco.jpg' },
  { label: 'Telur Ayam Segar Peti 10kg', url: '/products/telur_ayam.jpg' },
  { label: 'Bawang Merah Bal 5kg', url: '/products/bawang_merah.jpg' },
  { label: 'Teh Pucuk / Teh Botol Dus', url: '/products/tehbotol.jpg' },
  { label: 'Kopi Kapal Api Spesial Mix Renceng', url: '/products/kopi_kapal_api.jpg' },
  { label: 'Sunlight Jeruk Nipis 700ml', url: '/products/sunlight_dishsoap.jpg' },
  { label: 'Rinso Bubuk Anti Noda 770gr', url: '/products/rinso_deterjen.jpg' },
  { label: 'Lifebuoy Sabun Mandi Dus', url: '/products/lifebuoy_soap.jpg' },
  { label: 'Pepsodent Pasta Gigi 190gr', url: '/products/pepsodent_pasta_gigi.jpg' },
];

/**
 * Resolves product image to authentic local photo if matching known product keywords
 * or if URL is an outdated unsplash generic stock placeholder.
 */
export function getAuthenticProductImage(name: string = '', currentUrl?: string): string {
  // If the user uploaded a custom image (base64 data URL), always prioritize it!
  if (currentUrl && currentUrl.startsWith('data:image/')) {
    return currentUrl;
  }

  // If already pointing to local authentic product image, return directly
  if (currentUrl && currentUrl.startsWith('/products/')) {
    return currentUrl;
  }

  // If pointing to a custom URL that isn't the old generic unsplash placeholder
  if (currentUrl && currentUrl.startsWith('http') && !currentUrl.includes('unsplash.com/photo-')) {
    return currentUrl;
  }

  const lowerName = name.toLowerCase();

  // Exact or keyword mapping to authentic product photos
  if (lowerName.includes('beras')) return '/products/beras_ramos.jpg';
  if (lowerName.includes('minyak') || lowerName.includes('sunco') || lowerName.includes('bimoli') || lowerName.includes('filma') || lowerName.includes('sanct')) return '/products/minyak_goreng.jpg';
  if (lowerName.includes('gula') || lowerName.includes('gulaku')) return '/products/gula_pasir.jpg';
  if (lowerName.includes('indomie')) return '/products/indomie_dus.jpg';
  if (lowerName.includes('sedaap') || lowerName.includes('sedap')) return '/products/mie_sedaap.jpg';
  if (lowerName.includes('royco') || lowerName.includes('masako') || lowerName.includes('bumbu') || lowerName.includes('rempah') || lowerName.includes('ladaku')) return '/products/bumbu_royco.jpg';
  if (lowerName.includes('telur')) return '/products/telur_ayam.jpg';
  if (lowerName.includes('bawang')) return '/products/bawang_merah.jpg';
  if (lowerName.includes('teh') || lowerName.includes('pucuk') || lowerName.includes('sosro')) return '/products/tehbotol.jpg';
  if (lowerName.includes('kopi') || lowerName.includes('kapal api') || lowerName.includes('torabika') || lowerName.includes('luwak')) return '/products/kopi_kapal_api.jpg';
  if (lowerName.includes('sunlight') || lowerName.includes('cuci piring') || lowerName.includes('mama lemon')) return '/products/sunlight_dishsoap.jpg';
  if (lowerName.includes('rinso') || lowerName.includes('deterjen') || lowerName.includes('daia') || lowerName.includes('soklin') || lowerName.includes('so klin')) return '/products/rinso_deterjen.jpg';
  if (lowerName.includes('lifebuoy') || lowerName.includes('sabun mandi') || lowerName.includes('dettol') || lowerName.includes('giv') || lowerName.includes('lux')) return '/products/lifebuoy_soap.jpg';
  if (lowerName.includes('pepsodent') || lowerName.includes('pasta gigi') || lowerName.includes('odol') || lowerName.includes('ciptadent') || lowerName.includes('colgate')) return '/products/pepsodent_pasta_gigi.jpg';

  // Fallback to provided URL or default store product placeholder
  return currentUrl || '/products/indomie_dus.jpg';
}


export function createWhatsAppMessage({
  orderId,
  customerName,
  customerPhone,
  customerAddress,
  notes,
  items,
  totalAmount,
  totalSaved,
}: {
  orderId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    priceApplied: number;
    subtotal: number;
    isWholesale: boolean;
  }[];
  totalAmount: number;
  totalSaved: number;
}): string {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = `*PESANAN MIDWAYMART*\n`;
  if (orderId) {
    text += `No. Nota: #${orderId.slice(-6).toUpperCase()}\n`;
  }
  text += `Waktu: ${dateStr}\n\n`;
  text += `*Data Pemesan:*\n`;
  text += `• Nama: ${customerName}\n`;
  text += `• No. WA/Telp: ${customerPhone}\n`;
  if (customerAddress) {
    text += `• Alamat Kirim/Toko: ${customerAddress}\n`;
  }
  if (notes) {
    text += `• Catatan: ${notes}\n`;
  }

  text += `\n*Daftar Barang Grosir:*\n`;
  items.forEach((item, idx) => {
    const tierTag = item.isWholesale ? ' [HARGA GROSIR]' : '';
    text += `${idx + 1}. *${item.name}*\n   ${item.quantity} ${item.unit} x ${formatRupiah(item.priceApplied)} = ${formatRupiah(item.subtotal)}${tierTag}\n`;
  });

  text += `\n*Total Tagihan: ${formatRupiah(totalAmount)}*`;
  if (totalSaved > 0) {
    text += `\n(Hemat Grosir: ${formatRupiah(totalSaved)})`;
  }
  text += `\n\nMohon konfirmasi ketersediaan barang dan jadwal pengiriman. Terima kasih!`;

  return encodeURIComponent(text);
}
