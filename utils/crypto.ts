
/**
 * Simple SHA-256 implementation using SubtleCrypto
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function detectNetwork(address: string): string {
  const trimmed = address.trim();
  // EVM
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return 'Ethereum / EVM';
  // Bitcoin Legacy
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) return 'Bitcoin (Legacy)';
  // Bitcoin SegWit
  if (/^bc1[ac-hj-np-z02-9]{11,71}$/.test(trimmed)) return 'Bitcoin (SegWit)';
  // Solana
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return 'Solana';
  // ENS (Simplified)
  if (/\.eth$/.test(trimmed)) return 'ENS Domain';
  
  return 'Unknown / Generic';
}

export function isValidAddress(address: string): boolean {
  const network = detectNetwork(address);
  if (network === 'Unknown / Generic') {
    // Basic length check for unknown networks
    return address.length >= 26 && address.length <= 80;
  }
  return true;
}

export function splitAddress(address: string) {
  const len = address.length;
  const prefixLen = 6;
  const suffixLen = 6;
  
  if (len <= prefixLen + suffixLen) {
    return { prefix: address, middle: '', suffix: '' };
  }

  const prefix = address.substring(0, prefixLen);
  const suffix = address.substring(len - suffixLen);
  const middle = address.substring(prefixLen, len - suffixLen);
  
  return { prefix, middle, suffix };
}
