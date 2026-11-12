import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff]
  }
  return ~c
}

const table = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  table[n] = c
}

function makeChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(4 + 4 + len + 4)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4, 4, 'ascii')
  data.copy(buf, 8)
  const crc = crc32(buf.subarray(4, 8 + len))
  buf.writeInt32BE(crc, 8 + len)
  return buf
}

function createPng(width, height) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // 8 bits per channel
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // Raw image data: height rows, each: 1 byte filter (0) + width * 4 bytes RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  let pos = 0
  const center = width / 2
  const radius = width * 0.42

  for (let y = 0; y < height; y++) {
    raw[pos++] = 0 // filter type none
    for (let x = 0; x < width; x++) {
      const dx = x - center
      const dy = y - center
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // Blue background (#2563EB = 37, 99, 235)
      // With inner graduation symbol / emblem
      if (dist <= radius) {
        // gradient effect
        const ratio = y / height
        const r = Math.round(37 + ratio * 20)
        const g = Math.round(99 + ratio * 15)
        const b = Math.round(235 - ratio * 30)

        // Draw inner white cap emblem
        const inCap = Math.abs(dx) * 0.5 + Math.abs(dy - center * 0.1) < width * 0.25
        if (inCap && y > center * 0.7 && y < center * 1.3) {
          raw[pos++] = 255
          raw[pos++] = 255
          raw[pos++] = 255
          raw[pos++] = 255
        } else {
          raw[pos++] = r
          raw[pos++] = g
          raw[pos++] = b
          raw[pos++] = 255
        }
      } else {
        // Transparent outside rounded circle
        raw[pos++] = 0
        raw[pos++] = 0
        raw[pos++] = 0
        raw[pos++] = 0
      }
    }
  }

  const compressed = zlib.deflateSync(raw)
  const idat = makeChunk('IDAT', compressed)
  const ihdrChunk = makeChunk('IHDR', ihdr)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idat, iendChunk])
}

const iconsDir = path.resolve('public/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192))
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512))
console.log('PWA Icons generated successfully: icon-192.png and icon-512.png')
