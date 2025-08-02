import express from "express";
import { askAgent, initAgent } from "./agent";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const app = express();
app.use(express.json());
dotenv.config();

const PORT = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "uploads",
      resource_type: "raw",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      format: "pdf",
      access_mode: "public",
    };
  },
});

const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const filePath = req.file.path;

    const filename = req.file.filename || req.file.originalname;
    const fileWithTimestamp = filename.split("/").pop() || "";
    const parts = fileWithTimestamp.split("-");
    const name = parts.slice(1).join("-");

    
    await initAgent(filePath);

    return res.json({
      message: "File uploaded successfully",
      path: filePath,
      filename: name,
    });
  } catch (error) {
    console.error("Error in upload processing:", error);
    return res
      .status(500)
      .json({ error: "Failed to embed and initialize agent" });
  }
});
app.post("/api/setFile", async (req, res) => {
  try {
    const filePath = req.body.path;
    if (!filePath) return res.status(400).json({ error: "No file found" });
    await initAgent(filePath);
    return res.json({ message: "File uploaded successfully", path: filePath });
  } catch (error) {
    console.error("Error in upload processing:", error);
    return res
      .status(500)
      .json({ error: "Failed to embed and initialize agent" });
  }
});

app.post("/api/ask", async (req, res) => {
  const { qs } = req.body;

  try {
    const ans = await askAgent(qs);
    return res.json({ ans });
  } catch (error) {
    console.log("Error on asking", error);
    return res.status(500).json({ error: "error occured" });
  }
});

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server Listen on Port ${PORT}`);
});
