import type { NextPage } from "next";
import Head from "next/head";
import Skeleton from "react-loading-skeleton";
import { useWeb3App } from "../hooks/web3";
import { appChain, getAddChainParameters } from "../chains";
import { SelectWallet } from "../components/SelectWallet";
import { SignIn } from "../components/SignIn";
import { EscrowCardLoader } from "../components/EscrowItem";
import { EscrowContext } from "../contexts/EscrowContext";
import { Profile } from "../components/Profile";
import { AllEscrows } from "../components/AllEscrows";
import { useRouter } from 'next/router'

const Index: NextPage = () => {
	const chain = getAddChainParameters(appChain);
	const router = useRouter()
	const { provider, address, ensName, ensAvatar, loading, isActive, escrowContract, tokenContract, logIn, logOut } = useWeb3App();


	const isSigned = ()=>{


		if(address && address != undefined){
			return (
				<>
					<EscrowContext.Provider value={{
							signerAddress: address,
							escrowContract,
							tokenContract,
							provider,
							ensName,
							ensAvatar
						}}>
						<Profile logOut={logOut}/>
						<AllEscrows/>
					</EscrowContext.Provider>
				</>
			) 
		}else{
			router.push('/signin')
			return <></>
		}


	}

	return (
		<div className="container main" style={{maxWidth:'80%'}}>
			<Head>
				<title>{isActive ? "Your Escrows" : "Connect Wallet"}</title>
			</Head>
			
			{loading ? (
				<div className="row vh-100 justify-content-center align-items-center">
					<div className="col">
						<Skeleton className="mb-3"/>
						<div className="row justify-content-center align-items-center mt-4">
							{[...Array(4)].map((_, i) => (<div key={i} className="col-lg-3 col-md-4"><EscrowCardLoader/></div>))}
						</div>
					</div>
				</div>
			) : (
				<>
					{isActive || <SelectWallet/>}
					{isActive && (
						<div>
							{isSigned() }
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default Index;
