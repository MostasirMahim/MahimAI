import express from "express";
import { askAgent, initAgent } from "./agent";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";

const app = express();
app.use(express.json());
dotenv.config();

const PORT = process.env.PORT || 5000;


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "data/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const filePath = req.file.path;
    const filename = req.file.filename;
    await initAgent(filePath);

    return res.json({
      message: "File uploaded successfully",
      path: filePath,
      filename: filename,
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
