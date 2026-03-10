// LinkedIn Post Saver - Icon Generator
// Çalıştır: node generate-icons.js
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

// CRC32 tablosu
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crcVal = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuffer, data, crcBuf]);
}

function createIcon(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Piksel verileri: LinkedIn mavi (#0077B5) arka plan + beyaz yer işareti
  const raw = Buffer.alloc((1 + size * 4) * size, 0);

  // İkon merkezi ve boyutlar
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42; // köşe yarıçapı için

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    raw[rowOffset] = 0; // filter byte

    for (let x = 0; x < size; x++) {
      const pixOffset = rowOffset + 1 + x * 4;

      // Köşe yarıçaplı kare arka plan
      const rx = Math.abs(x - cx + 0.5);
      const ry = Math.abs(y - cy + 0.5);
      const cornerR = size * 0.2;
      const inBg =
        rx <= r &&
        ry <= r &&
        (rx <= r - cornerR ||
          ry <= r - cornerR ||
          Math.sqrt((rx - (r - cornerR)) ** 2 + (ry - (r - cornerR)) ** 2) <=
            cornerR);

      if (inBg) {
        // LinkedIn mavi #0077B5
        raw[pixOffset] = 0;
        raw[pixOffset + 1] = 119;
        raw[pixOffset + 2] = 181;
        raw[pixOffset + 3] = 255;

        // Yer işareti (bookmark) çiz
        const bx = (x - cx) / size; // -0.5 .. 0.5
        const by = (y - cy) / size;
        const bw = 0.22; // genişlik yarısı
        const bt = -0.28; // üst
        const bb = 0.3; // alt
        const notch = 0.06; // orta çentik

        const inBookmark =
          Math.abs(bx) <= bw &&
          by >= bt &&
          by <= bb &&
          !(by >= bb - notch * 2 &&
            Math.abs(bx) <= bw - notch + (notch * Math.abs(bx)) / bw);

        if (inBookmark) {
          raw[pixOffset] = 255;
          raw[pixOffset + 1] = 255;
          raw[pixOffset + 2] = 255;
          raw[pixOffset + 3] = 255;
        }
      } else {
        // Şeffaf
        raw[pixOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// icons/ klasörünü oluştur
const iconsDir = path.join(__dirname, "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// İkonları oluştur
[16, 48, 128].forEach((size) => {
  const png = createIcon(size);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`✓ icon${size}.png oluşturuldu (${png.length} bytes)`);
});

console.log("\nTüm ikonlar hazır! icons/ klasörüne bakabilirsin.");
