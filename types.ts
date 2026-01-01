
export interface AddressCheck {
  id: string;
  address: string;
  timestamp: number;
  isSuspicious: boolean;
  prefix: string;
  middle: string;
  suffix: string;
  fingerprint: string;
  network: string;
}

export enum NetworkType {
  ETHEREUM = 'Ethereum/EVM',
  BITCOIN = 'Bitcoin',
  SOLANA = 'Solana',
  UNKNOWN = 'Unknown'
}
