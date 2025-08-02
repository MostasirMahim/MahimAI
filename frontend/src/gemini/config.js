import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCa23SrqZccoXRo4vFmPYUYhnRGqvMZ2zQ";
const genAI = new GoogleGenerativeAI( apiKey );
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });;



export default async function run(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.log(error);
    return "I am Offline, Replay You Later";
  }
}
