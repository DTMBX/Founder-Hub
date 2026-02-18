function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
  
  let bits = 0
  let value = 0
  const output: number[] = []

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = alphabet.indexOf(cleanInput[i])
    if (idx === -1) continue

    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return new Uint8Array(output)
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message.buffer as ArrayBuffer)
  return new Uint8Array(signature)
}

function dynamicTruncate(hmacResult: Uint8Array): number {
  const offset = hmacResult[hmacResult.length - 1] & 0x0f
  
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  
  return code % 1000000
}

export async function generateTOTP(secret: string, timeStep = 30, digits = 6): Promise<string> {
  const key = base32Decode(secret)
  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / timeStep)
  
  const counterBuffer = new Uint8Array(8)
  const view = new DataView(counterBuffer.buffer)
  view.setBigUint64(0, BigInt(counter), false)
  
  const hmacResult = await hmacSha1(key, counterBuffer)
  const code = dynamicTruncate(hmacResult)
  
  return code.toString().padStart(digits, '0')
}

export async function verifyTOTP(
  secret: string,
  token: string,
  window = 1,
  timeStep = 30
): Promise<boolean> {
  const epoch = Math.floor(Date.now() / 1000)
  const currentCounter = Math.floor(epoch / timeStep)
  
  for (let i = -window; i <= window; i++) {
    const testCounter = currentCounter + i
    const counterBuffer = new Uint8Array(8)
    const view = new DataView(counterBuffer.buffer)
    view.setBigUint64(0, BigInt(testCounter), false)
    
    const key = base32Decode(secret)
    const hmacResult = await hmacSha1(key, counterBuffer)
    const code = dynamicTruncate(hmacResult)
    const expectedToken = code.toString().padStart(6, '0')
    
    if (expectedToken === token) {
      return true
    }
  }
  
  return false
}

export function generateSecret(length = 20): string {
  const buffer = new Uint8Array(length)
  crypto.getRandomValues(buffer)
  return base32Encode(buffer)
}

export function generateQRCodeURL(
  secret: string,
  issuer: string,
  accountName: string
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30'
  })
  
  const otpauthURL = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauthURL)}`
}
