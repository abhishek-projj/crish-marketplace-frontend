import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'


const projectId = '2GoOI2SokjsSFEBaUpKTrj5hikP';
const projectSecret = 'a5fefc462f1db5ec3fb942f99a7c8f1e';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
const client = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
})

import {
  marketplaceAddress
} from '../config.js'

import NFTMarketplace from '../src/abis/NFTMarketplace.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' });

  const [loadingDataToIpfs, setLoadingDataToIpfs] = useState(false);
  const router = useRouter();


  // async function uploadImageToIpfs(file) {
  //   setLoadingDataToIpfs(true)
  //   try {
  //     const url = 'https://api.web3.storage/upload';
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('fileName', file.name);
  //     const config = {
  //       headers: {
  //         'accept': 'application/json',
  //         'content-type': 'multipart/form-data',
  //         'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDJkNTk3ZkYzOGJFZjdCMzNmODRhOWJhOTU3M0Y2NjYwMTM5RDBBMDkiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjcwMTk3NDM0MzcsIm5hbWUiOiJtYXJrZXRwbGFjZSJ9.VOs7pHuS1sAImbs0XVQ110UQmOAJzRHUWAlhd3GwPGg',
  //       },
  //     };
  //     const uploadedData = await axios.post(url, formData, config);
  //     const ipfsURL = `https://w3s.link/ipfs/${uploadedData.data.cid}`
  //     console.log('====================================');
  //     console.log(ipfsURL);
  //     console.log('====================================');
  //     setLoadingDataToIpfs(false)
  //     return ipfsURL;
  //   } catch (error) {
  //     setLoadingDataToIpfs(false)

  //     console.log('Error uploading file: ', error)
  //   }

  // }


  async function uploadImageToIpfs(file) {
    setLoadingDataToIpfs(true)
    const added = await client.add(file);
    setLoadingDataToIpfs(false)

    console.log('====================================');
    console.log(added);
    console.log('====================================');
    return `https://infura-ipfs.io/ipfs/${added.path}`;
  }


  async function onChange(e) {
    const file = e.target.files[0];
    setFileUrl(null);
    const urlimage = await uploadImageToIpfs(file);
    setFileUrl(urlimage);
  }
  async function uploadToIPFS() {

    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })

    const file = new Blob([data], { type: 'text/json' });
    const urlimage = await uploadImageToIpfs(file);
    return urlimage
  }

  async function listNFTForSale() {
    if (loadingDataToIpfs) return;
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
            <Image alt="" className="rounded mt-4" width={200} height={200} src={fileUrl} />
            )
          }
        {

          loadingDataToIpfs && (
            fileUrl === null ?
              <h6>uploading image to ipfs. please wait...</h6>
              :
              <h6>uploading Metadata to ipfs. please wait...</h6>)

        }
        <button disabled={loadingDataToIpfs} onClick={listNFTForSale} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create NFT
        </button>
      </div>
    </div>
  )
}