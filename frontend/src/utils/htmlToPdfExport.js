import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Mencari titik potong baris piksel putih/kosong terdekat
 * agar tidak memotong baris teks atau garis pembatas tabel di tengah.
 */
function findCleanPageBreakY(ctx, width, targetY, minSearchY) {
  try {
    const searchHeight = Math.max(1, Math.floor(targetY - minSearchY));
    const startY = Math.floor(minSearchY);
    const imgData = ctx.getImageData(0, startY, width, searchHeight);
    const data = imgData.data;

    // Scan dari bawah (targetY) ke atas (minSearchY)
    for (let relY = searchHeight - 1; relY >= 0; relY--) {
      let isBlankRow = true;
      const rowOffset = relY * width * 4;

      // Sample piksel di area isi konten (hindari tepi luar)
      const startX = Math.floor(width * 0.05);
      const endX = Math.floor(width * 0.95);

      for (let x = startX; x < endX; x += 6) {
        const i = rowOffset + x * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Jika piksel bukan putih bersih (ada goresan teks / border / background)
        if (a > 40 && (r < 240 || g < 240 || b < 240)) {
          isBlankRow = false;
          break;
        }
      }

      if (isBlankRow) {
        return startY + relY;
      }
    }
  } catch (err) {
    console.warn('[htmlToPdfExport] findCleanPageBreakY warning:', err);
  }
  return targetY;
}

/**
 * Mengonversi elemen HTML DOM ke file PDF standar A4 dengan:
 * 1. Font formal Times New Roman secara seragam.
 * 2. Pemotongan cerdas (Smart Pagination) berbasis batas elemen DOM (tabel, baris tr, kotak tanda tangan) & scan piksel.
 * 3. Jika dokumen surat (seperti Offering Letter) hampir muat 1 halaman, otomatis fit 1 halaman penuh (zero orphan signature).
 * 4. Langsung download file PDF ke perangkat.
 */
export async function exportHtmlElementToPdf(element, fileName, options = {}) {
  if (!element) {
    throw new Error('Elemen dokumen tidak ditemukan.');
  }

  const {
    padding = '24px 36px',
    targetWidth = 794, // Standar lebar A4 pada 96 DPI
  } = options;

  // 1. Buat kloning elemen di luar layar
  const clone = element.cloneNode(true);
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.width = `${targetWidth}px`;
  clone.style.position = 'absolute';
  clone.style.top = '-99999px';
  clone.style.left = '-99999px';
  clone.style.background = '#ffffff';
  clone.style.padding = padding;
  clone.style.boxSizing = 'border-box';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.fontFamily = "'Times New Roman', Times, serif";

  // Suntikkan style formal Times New Roman ke seluruh turunan elemen kloning
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    * {
      font-family: 'Times New Roman', Times, serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `;
  clone.appendChild(styleEl);
  document.body.appendChild(clone);

  try {
    // 2. Kumpulkan koordinat batas elemen-elemen yang tidak boleh terpotong (tr, thead, header, signature)
    const cloneRect = clone.getBoundingClientRect();
    const candidateSelectors = [
      '.keep-together',
      '[data-no-break="true"]',
      '.signature-grid',
      '.signature-block',
      '.section-header-box',
      '.pasal-block',
      '.ant-row',
      'thead',
      'tr',
    ];
    const candidateNodes = clone.querySelectorAll(candidateSelectors.join(', '));
    const noBreakBounds = [];

    candidateNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const top = rect.top - cloneRect.top;
      let bottom = rect.bottom - cloneRect.top;
      const height = rect.height;

      // Header box harus menjaga minimal 60px konten di bawahnya agar tidak menjadi header yatim
      if (node.classList.contains('section-header-box') || node.tagName.toLowerCase() === 'thead') {
        bottom += 60;
      }

      // Catat elemen yang memiliki tinggi valid dan tidak melebihi 1 halaman penuh
      if (height > 6 && height < 900) {
        noBreakBounds.push({
          top,
          bottom,
          height,
          isHighPriority:
            node.classList.contains('keep-together') ||
            node.classList.contains('signature-grid') ||
            node.classList.contains('signature-block') ||
            node.classList.contains('section-header-box') ||
            node.classList.contains('pasal-block') ||
            node.getAttribute('data-no-break') === 'true',
        });
      }
    });

    // Urutkan elemen berdasarkan posisi top
    noBreakBounds.sort((a, b) => a.top - b.top);

    // 3. Render elemen ke canvas resolusi tinggi (2x scale)
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    // Tinggi 1 halaman A4 penuh (297mm) dalam koordinat piksel kanvas
    const maxPageCanvasHeight = Math.floor((canvas.width * 297) / 210);
    const canvasScale = canvas.width / clone.clientWidth;
    const ctx = canvas.getContext('2d');

    // Cek apakah dokumen surat 1 halaman (seperti Offering Letter) atau hampir muat 1 halaman (toleransi s/d 18%)
    // Otomatis fit 1 halaman penuh (zero orphan signature block)
    if (options.fitSinglePage || canvas.height <= maxPageCanvasHeight * 1.18) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = maxPageCanvasHeight;
      const pageCtx = pageCanvas.getContext('2d');
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      const scale = Math.min(1, maxPageCanvasHeight / canvas.height);
      const drawWidth = canvas.width * scale;
      const drawHeight = canvas.height * scale;
      const offsetX = Math.floor((pageCanvas.width - drawWidth) / 2);

      pageCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, offsetX, 0, drawWidth, drawHeight);

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(fileName);
      return { success: true, pageCount: 1 };
    }

    let currentY = 0;
    let pageNum = 0;

    // 4. Multi-page Loop dengan perlindungan elemen tidak terpotong
    while (currentY < canvas.height) {
      let sliceHeight = maxPageCanvasHeight;

      if (currentY + sliceHeight < canvas.height) {
        let rawTargetY = currentY + sliceHeight;
        let adjustedTargetY = rawTargetY;

        // Periksa apakah target split memotong elemen tak terputus (noBreakBounds)
        for (let i = 0; i < noBreakBounds.length; i++) {
          const bound = noBreakBounds[i];
          const elTopCanvas = bound.top * canvasScale;
          const elBottomCanvas = bound.bottom * canvasScale;

          // Jika garis potong jatuh tepat di tengah elemen
          if (elTopCanvas < rawTargetY && elBottomCanvas > rawTargetY) {
            // Potong tepat sebelum elemen dimulai (dengan margin aman 4px)
            const safeCutY = elTopCanvas - 4 * canvasScale;
            // Pastikan halaman masih memiliki isi minimal yang memadai (>= 30% tinggi halaman)
            if (safeCutY > currentY + maxPageCanvasHeight * 0.3) {
              adjustedTargetY = safeCutY;
              break;
            }
          }
        }

        // Cari baris putih kosong di sekitar titik potong yang aman jika memungkinkan
        const minSearchY = Math.max(currentY + 150, adjustedTargetY - Math.floor(maxPageCanvasHeight * 0.2));
        const cleanBreakY = findCleanPageBreakY(ctx, canvas.width, adjustedTargetY, minSearchY);
        sliceHeight = cleanBreakY - currentY;
      } else {
        sliceHeight = canvas.height - currentY;
      }

      if (sliceHeight <= 0) {
        sliceHeight = maxPageCanvasHeight;
      }

      // Buat potongan kanvas halaman A4 penuh
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = maxPageCanvasHeight;
      const pageCtx = pageCanvas.getContext('2d');
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0,
        currentY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);

      if (pageNum > 0) {
        pdf.addPage();
      }

      pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      currentY += sliceHeight;
      pageNum++;
    }

    // 5. Download file PDF langsung ke komputer pengguna
    pdf.save(fileName);
    return { success: true, pageCount: pageNum };
  } finally {
    document.body.removeChild(clone);
  }
}
