//@ts-nocheck
import {ChatGoogleGenerativeAI} from "@langchain/google-genai"
import { RetrievalQAChain } from "langchain/chains";
import { embedPdf } from "./ingest";

let qsChain: RetrievalQAChain;
export const initAgent = async (filePath:string) => {
  const vectorStores = await embedPdf(filePath);
  const retriever = vectorStores.asRetriever();
  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.0-flash",
    temperature: 0,
  });

  qsChain = RetrievalQAChain.fromLLM(model, retriever);
};

export const askAgent = async(qs:string): Promise<string>=> {
    if(!qsChain) {
        throw new Error("agent Not Initialized");
    }
    const res = await qsChain.call({query:qs})
    return res.text || res.output_text;
}
