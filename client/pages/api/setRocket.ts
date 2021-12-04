// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { NFTStorage } from "nft.storage";
import { Blob } from "nft.storage";

export const config = {
  api: {
    bodyParser: false,
  },
};

const blobPayloadParser = (req: NextApiRequest): Promise<Buffer> =>
  new Promise((resolve) => {
    let data: Uint8Array[] = [];
    req.on("data", (chunk) => {
      data.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(data));
    });
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    if (process.env.NFTSTORAGE_API_KEY) {
      const client = new NFTStorage({
        token: process.env.NFTSTORAGE_API_KEY,
      });

      const data = await blobPayloadParser(req);
      const blob = new Blob([data]);

      const cid = await client.storeBlob(blob);
      const ipfsUri = `ipfs://${cid}`;
      res.status(200).json({ ipfsUri });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
