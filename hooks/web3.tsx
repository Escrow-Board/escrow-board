import toast from "react-hot-toast";
import { settings } from "../lib/settings";
import { useCallback, useState } from "react";
import { useEffect } from "react";
import * as Web3Token from "web3-token";
import { useWeb3React } from "@web3-react/core";
import type { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';
import { ethers } from "ethers";
import EscrowHubCompiled from '../artifacts/contracts/EscrowHub.sol/EscrowHub.json'
import TokenABI from '../lib/erc20.abi.json'
import { Web3Storage } from "web3.storage";
import { EscrowHub } from "../types/EscrowHub";
import { appChain, getAddChainParameters } from "../chains";
import { Token } from "../types/Token";
import { useRouter } from "next/router";
import { create } from '@web3-storage/w3up-client'

export const useAddress = () => {
  const [signedToken, setSignedToken] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();

  useEffect(() => {
    const token = localStorage.getItem(settings.localStorageKey);
    if (token) {
      setSignedToken(token);
    }
  }, []);

  useEffect(() => {
    if (signedToken) {
      try {
        const { address } = Web3Token.verify(signedToken);
        setAddress(address);
      } catch (e) {
        setAddress(undefined);
      }
    } else {
      setAddress(undefined);
    }
  }, [signedToken]);

  const saveSignedToken = useCallback((token: string) => {
    localStorage.setItem(settings.localStorageKey, token);
    setSignedToken(token);
  }, []);

  const removeSignedToken = useCallback(() => {
    localStorage.removeItem(settings.localStorageKey);
    setSignedToken(undefined);
  }, []);

  return { address, saveSignedToken, removeSignedToken };
};

export const useWeb3App = () => {
  const router = useRouter()
  const { connector, account, isActivating, isActive, provider } = useWeb3React<Web3Provider>();
  const { address, saveSignedToken, removeSignedToken } = useAddress();
  const [escrowContract, setEscrowContract] = useState<EscrowHub>();
  const [tokenContract, setTokenContract] = useState<Token>();
  const [ensName, setEnsName] = useState<string | undefined>();
  const [ensAvatar, setEnsAvatar] = useState<string | undefined>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined)

  const [logInTrigger, setLogInTrigger] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connector && connector.connectEagerly) {
      connector.connectEagerly(getAddChainParameters(appChain))
    }
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isActive && address) {
      setLoading(false);
    }
  }, [address, isActive]);

  useEffect(() => {
    if (provider && account) {
      const signer = provider.getSigner(account)
      setEscrowContract(new ethers.Contract(
        (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string).replace(/^\n|\n$/g, ''),
        EscrowHubCompiled.abi,
        signer
      ) as unknown as EscrowHub);
      setTokenContract(new ethers.Contract(
        (process.env.NEXT_PUBLIC_TOKEN_ADDRESS as string).replace(/^\n|\n$/g, ''),
        TokenABI,
        signer
      ) as unknown as Token);
      setSigner(signer)

      if (provider?.network?.ensAddress) {
        provider.lookupAddress(account).then(ensName => {
          if (ensName) {
            setEnsName(ensName);
            provider.getResolver(ensName).then(resolver => {
              if (resolver) {
                resolver.getAvatar().then(avatar => {
                  if (avatar) {
                    setEnsAvatar(avatar.url);
                  }
                })
              }
            })
          }
        })
      }
    }
  }, [provider, account])

  const logIn = useCallback(async () => {
    setLogInTrigger(true);
  }, []);

  const logOut = useCallback(async () => {
    removeSignedToken();
    if (connector?.deactivate) {
      void connector.deactivate()
    }
  }, [connector, removeSignedToken]);

  useEffect(() => {
    if (signer && logInTrigger) {
      const signPromise: Promise<string> = new Promise(async (res, rej) => {
        try {
          const token = await Web3Token.sign(
            async (msg: string) => {
              try {
                const signature = await signer.signMessage(msg)
                return signature
              } catch (e) {
                return ''
              }
            },
            {
              expires_in: "1d",
              statement: settings.SIGN_MESSAGE,
            }
          );
          if (token == '') throw new Error("Rejected")
          res(token);
        } catch (e) {
          rej(e);
        }
      });
      toast
        .promise(signPromise, {
          loading: "Signing In...",
          success: (token: string) => {
            router.push('/')
            saveSignedToken(token);
            return <b>Signing Successful</b>;
          },
          error: (e) => <b>{e.message}</b>,
        })
        .then((token) => {
          setLogInTrigger(false);
        });
    }
  }, [signer, logInTrigger, saveSignedToken]);

  return { isActive, address, ensName, ensAvatar, provider, escrowContract, tokenContract, loading, logIn, logOut };
};

// export const useWeb3Storage = () => new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3_STORAGE_KEY ?? "", endpoint: new URL('https://web3.storage') })
