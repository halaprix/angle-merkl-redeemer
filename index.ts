import * as fs from 'node:fs';
import csv from 'csv-parser';
import axios from 'axios';
import { encodeFunctionData, http } from "viem"
import { angleMerklDistributorAbi } from "./abi"
import { createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { config } from "dotenv"
config()

const users: string[] = [];
const tokens: string[] = [];
const amounts: string[] = [];
const proofs: string[][] = [];
const promises: Promise<void>[] = [];
const encodedData: `0x${string}`[] = [];
const batchSize = 25;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is required");
}

if (!RPC_URL) {
  throw new Error("RPC_URL is required");
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(RPC_URL),

})

const tokensToClaim = [
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
].map((token) => token.toLowerCase());

fs.createReadStream('list.csv')
  .pipe(csv())
  .on('data', (row) => {
    const recipient = row['recipient'];
    const promise = axios.get(`https://api.angle.money/v3/rewards?user=${recipient}&chainIds=1`)
      .then(response => {
        const tokenData = response.data["1"].tokenData;
        let i = 0
        for (const token in tokenData) {
          if (tokensToClaim.includes(token.toLowerCase())) {
            users.push(recipient);
            tokens.push(token);
            amounts.push(tokenData[token].accumulated);
            proofs.push(tokenData[token].proof);
          }
        }
      })
      .catch(error => console.error(error));
    promises.push(promise);
  })
  .on('end', () => {
    Promise.all(promises)
      .then(async () => {
        for (let i = 0; i < users.length; i += batchSize) {
          const userBatch = users.slice(i, i + batchSize) as `0x${string}`[];
          const tokenBatch = tokens.slice(i, i + batchSize) as `0x${string}`[]
          const amountBatch = amounts.slice(i, i + batchSize).map((amount) => BigInt(amount)) as bigint[]
          const proofBatch = proofs.slice(i, i + batchSize) as `0x${string}`[][]

          const batch = [
            userBatch,
            tokenBatch,
            amountBatch,
            proofBatch,
          ] as const

          const encodedBatch = encodeFunctionData({ abi: angleMerklDistributorAbi, functionName: "claim", args: batch });
          try {
            const tx = await client.sendTransaction({ to: "0x3ef3d8ba38ebe18db133cec108f4d14ce00dd9ae", data: encodedBatch })
            console.log(`tx succesfull: ${tx}`)
          } catch (error) {
            console.error(error)
            encodedData.push(encodedBatch);
          }



        }

      })
      .catch(error => console.error(error));
  });



