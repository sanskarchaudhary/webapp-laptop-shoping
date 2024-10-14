// pages/api/readFile.ts
import { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const filePath = path.join(process.cwd() , '/utils/orders.json');
  console.log(filePath);
  try {
    const fileContents = await fs.readFile(filePath, "utf8");
    res.status(200).json({ content: fileContents });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: error });
  }
}
