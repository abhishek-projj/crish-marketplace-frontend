import { useState } from 'react'
import { ethers } from 'ethers'
// import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

import { Web3Storage} from 'web3.storage';

import Image from 'next/image'

const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDJkNTk3ZkYzOGJFZjdCMzNmODRhOWJhOTU3M0Y2NjYwMTM5RDBBMDkiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjcwMTk3NDM0MzcsIm5hbWUiOiJtYXJrZXRwbGFjZSJ9.VOs7pHuS1sAImbs0XVQ110UQmOAJzRHUWAlhd3GwPGg"
const client = new Web3Storage({ token:apiToken })



import {
  marketplaceAddress
} from '../config.js'

import NFTMarketplace from '../src/abis/NFTMarketplace.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    try {

      const rootCid = await client.put([file]);
      const url = `https://ipfs.infura.io/ipfs/${rootCid}`
      console.log('====================================');
      console.log(url);
      console.log('====================================');
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
  async function uploadToIPFS() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })


    client.add(data)
      .then(result => {
        const url = `https://ipfs.infura.io/ipfs/${result.path}`
        /* after file is uploaded to IPFS, return the URL to use it in the transaction */
        return url
      })
      .catch(error =>
        console.log('Error uploading file: ', error)
        )
  }

  async function listNFTForSale() {
    const url = await uploadToIPFS()
    // const url = "await uploadToIPFS()"
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString();

    console.log('====================================');
    console.log("aaaaa");
    console.log('====================================');
    let transaction = await contract.createToken(url, price, { value: listingPrice })
    await transaction.wait()
   
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <Image alt=""   className="rounded mt-4" width="350" src={fileUrl} />
          )
        }
        <button onClick={listNFTForSale} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create NFT
        </button>
      </div>
    </div>
  )
}