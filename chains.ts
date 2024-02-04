import type { AddEthereumChainParameter } from '@web3-react/types'

export const appChain = process.env.NEXT_PUBLIC_CHAIN?Number(process.env.NEXT_PUBLIC_CHAIN):31337

const ETH: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
}

const KLAY: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Klayton',
  symbol: 'KLAY',
  decimals: 18,
}
 

const MATIC: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Matic',
  symbol: 'MATIC',
  decimals: 18,
}

interface BasicChainInformation {
  urls: string[]
  name: string
}

interface ExtendedChainInformation extends BasicChainInformation {
  nativeCurrency: AddEthereumChainParameter['nativeCurrency']
  blockExplorerUrls: AddEthereumChainParameter['blockExplorerUrls']
}

function isExtendedChainInformation(
  chainInformation: BasicChainInformation | ExtendedChainInformation
): chainInformation is ExtendedChainInformation {
  return !!(chainInformation as ExtendedChainInformation).nativeCurrency
}

export function getAddChainParameters(chainId: number): AddEthereumChainParameter | number {
  const chainInformation = CHAINS[chainId]
  if (isExtendedChainInformation(chainInformation)) {
    return {
      chainId,
      chainName: chainInformation.name,
      nativeCurrency: chainInformation.nativeCurrency,
      rpcUrls: chainInformation.urls,
      blockExplorerUrls: chainInformation.blockExplorerUrls,
    }
  } else {
    return chainId
  }
}

export const CHAINS: { [chainId: number]: BasicChainInformation | ExtendedChainInformation } = {
  1: {
    urls: [
      process.env.NEXT_PUBLIC_INFURA_KEY ? `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` : '',
      process.env.alchemyKey ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.alchemyKey}` : '',
      'https://cloudflare-eth.com',
    ].filter((url) => url),
    name: 'Mainnet',
  }
 ,
  1891: {
    urls: [
      'https://replicator.pegasus.lightlink.io/rpc/v1',
    ],
    name: 'Light Link testnet',
    nativeCurrency: {
      name: 'LETH',
      symbol: 'LETH',
      decimals: 18
    }
  },
  
  
  // https://public-en-baobab.klaytn.net
}

export const URLS: { [chainId: number]: string[] } = Object.keys(CHAINS).reduce<{ [chainId: number]: string[] }>(
  (accumulator, chainId) => {
    const validURLs: string[] = CHAINS[Number(chainId)].urls

    if (validURLs.length) {
      accumulator[Number(chainId)] = validURLs
    }

    return accumulator
  },
  {}
)
