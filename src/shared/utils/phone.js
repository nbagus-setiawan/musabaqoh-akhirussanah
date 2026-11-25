/**
 * Utilitas normalisasi nomor telepon / WhatsApp Indonesia.
 *
 * Masalah utama Google Sheets:
 * Angka "085269848261" jika disimpan sebagai angka akan kehilangan angka 0 di depan
 * menjadi "85269848261". Saat dibuka lewat wa.me/85269848261, WhatsApp membaca
 * kode negara +852 (Hong Kong).
 *
 * Aturan standar:
 * - Tampilan & penyimpanan lokal memakai format 08... ("085269848261").
 * - Tautan wa.me/... memakai format 628... ("6285269848261") tanpa tanda "+".
 */

/**
 * Normalisasi nomor ke format lokal Indonesia "08..." untuk tampilan dan penyimpanan.
 * @param {string|number} rawPhone
 * @returns {string}
 */
export function normalizePhoneLocal08(rawPhone) {
  if (rawPhone === undefined || rawPhone === null) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';

  // Hapus prefix 0062... -> 0...
  if (digits.startsWith('0062')) {
    const rest = digits.slice(4).replace(/^0+/, '');
    return rest ? `0${rest}` : '';
  }

  // Konversi prefix 62... (+628... / 628... / 6208...) -> 08...
  if (digits.startsWith('62') && digits.length >= 10) {
    const rest = digits.slice(2).replace(/^0+/, '');
    return rest ? `0${rest}` : '';
  }

  // Pulihkan angka 0 depan jika terpotong oleh Google Sheets (misal "85269848261" -> "085269848261")
  if (digits.startsWith('8') && digits.length >= 9) {
    return `0${digits}`;
  }

  // Pastikan tidak ada dobel 0 di awal ("008..." -> "08...")
  if (digits.startsWith('0')) {
    const rest = digits.slice(1).replace(/^0+/, '');
    return rest ? `0${rest}` : '0';
  }

  return digits;
}

/**
 * Normalisasi nomor ke format internasional "62..." tanpa "+" untuk tautan wa.me.
 * @param {string|number} rawPhone
 * @returns {string}
 */
export function normalizePhoneWa62(rawPhone) {
  const local = normalizePhoneLocal08(rawPhone);
  if (!local) return '';

  if (local.startsWith('0')) {
    return `62${local.slice(1)}`;
  }
  if (local.startsWith('8') && local.length >= 9) {
    return `62${local}`;
  }
  return local;
}

/**
 * Membangun URL resmi WhatsApp https://wa.me/62...?text=...
 * @param {string|number} rawPhone
 * @param {string} [message='']
 * @returns {string}
 */
export function buildWaUrl(rawPhone, message = '') {
  const waDigits = normalizePhoneWa62(rawPhone);
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return waDigits ? `https://wa.me/${waDigits}${query}` : `https://wa.me/${query}`;
}

/**
 * Format nomor agar Google Sheets menyimpannya sebagai teks 08... tanpa memotong angka 0 di depan.
 * @param {string|number} rawPhone
 * @returns {string}
 */
export function toSheetPlainTextPhone(rawPhone) {
  const local = normalizePhoneLocal08(rawPhone);
  return local ? `'${local}` : '';
}
