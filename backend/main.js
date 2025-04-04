require("dotenv").config();
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const exifReader = require("exif-reader");
const { JSONPath } = require("jsonpath-plus");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = 8000;

const imageServer = axios.create({
  baseURL:
    process.env.BUCKET_BASE_URL ||
    "https://d-euw3-website-images-bucket-8tenders.s3.eu-west-3.amazonaws.com",
});

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }
  const truePassword = await imageServer
    .get(`/auth/${username}`, {
      timeout: 5000,
    })
    .then((response) => response.data.replace("\n", ""))
    .catch(() => null);

  if (truePassword === password) {
    res.status(200).send();
  } else {
    res.status(401).send("Unauthorized");
  }
});

app.get("/list-images", async (req, res) => {
  console.log(
    `Listing images... \nRequest Headers: ${JSON.stringify(
      req.headers,
      null,
      2
    )}`
  );

  try {
    const response = await imageServer.get("/", {
      timeout: 10000,
    });
    const xmlData = response.data;
    const regex = /<Key>([^<]+)<\/Key>/g;
    let match;
    const imageKeys = [];

    while ((match = regex.exec(xmlData)) !== null) {
      imageKeys.push(match[1]);
    }

    console.log("Images listed successfully");

    res.status(200).json(imageKeys.sort());
  } catch (error) {
    console.error("Error listing images:", error.message);
    res.status(500).send("Failed to list images");
  }
});

app.get("/fetch-image", async (req, res) => {
  const imagePath = req.query.path;
  console.log(
    `Fetching image: ${imagePath}\nRequest Headers: ${JSON.stringify(
      req.headers,
      null,
      2
    )}`
  );

  try {
    if (!imagePath) {
      return res.status(400).send("PATH parameter is required");
    }

    const response = await imageServer.get(`/${imagePath}.jpeg`, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
    console.log("Image fetched successfully");

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Length", response.headers["content-length"]);
    res.status(200).send(response.data);
  } catch (error) {
    console.error("Error fetching the image:", error.message);
    res.status(500).send("Failed to fetch the image");
  }
});

app.post("/query", upload.single("image"), async (req, res) => {
  const { query, imagePath } = req.body;
  const imageFile = req.file;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  let imageBuffer;

  try {
    console.log(
      `Processing query: ${query}\nRequest Headers: ${JSON.stringify(
        req.headers,
        null,
        2
      )}`
    );
    if (imageFile) {
      // If file is uploaded, use the buffer
      console.log("Processing uploaded image...");
      imageBuffer = imageFile.buffer;
    } else if (imagePath) {
      // If an image path is provided, read from image server
      console.log(`Reading image from path: ${imagePath}`);
      imageBuffer = await imageServer
        .get(`/${imagePath}.jpeg`, {
          responseType: "arraybuffer",
          timeout: 5000,
        })
        .then((response) => response.data);
    } else {
      return res
        .status(400)
        .json({ error: "Either an image file or an image path is required" });
    }

    // Extract metadata
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.exif) {
      return res.status(400).json({
        success: false,
        message: "No EXIF data found in the image.",
      });
    }

    // Extract EXIF data
    let exifData;
    try {
      console.log("Extracting EXIF data...");
      exifData = exifReader(metadata.exif);
      console.log("EXIF data extracted successfully");
    } catch (exifError) {
      console.error("Failed to extract EXIF data:", exifError);
      return res.status(400).json({
        success: false,
        message:
          "Failed to extract EXIF data. Make sure the image contains EXIF metadata.",
        error: exifError.message,
      });
    }

    // Process query
    const extractedData = {};
    const queryArray = JSON.parse(query);
    queryArray.forEach((q) => {
      const queryResult = JSONPath({ path: q, json: exifData });
      if (queryResult.length > 0) {
        const fieldName = q.split(".").pop();
        extractedData[fieldName] = queryResult;
      }
    });

    return res.json({
      success: true,
      extractedData,
    });
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the image.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
