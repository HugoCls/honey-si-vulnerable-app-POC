import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import ExifForm from "./ExifForm";

function App() {
  const [imageList, setImageList] = useState([]);
  const [imagePath, setImagePath] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [exifData, setExifData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [querySent, setQuerySent] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

  const axiosInstance = axios.create({
    baseURL: backendUrl,
  });

  const handleListImages = async () => {
    try {
      const response = await axiosInstance.get("/list-images");
      setImageList(response.data);
    } catch (error) {
      console.error("Error fetching the image list:", error);
    }
  };

  const handleFetchImage = async () => {
    if (!imagePath) {
      alert("Please enter an image path.");
      return;
    }

    try {
      const response = await axiosInstance.get("/fetch-image", {
        params: { path: imagePath },
        responseType: "arraybuffer",
      });

      const imageBlob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      setImageUrl(URL.createObjectURL(imageBlob));
      setSelectedFile(null); // Reset uploaded file selection
      setQuerySent(false);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file));
      setImagePath("");
      setQuerySent(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>EXIF VIEWER</h1>
      </header>
      <div className="container">
        <hr />

        <section className="section">
          <h2>List Available Images</h2>
          <button onClick={handleListImages}>List Images</button>
          <ul className="image-list" style={{ textAlign: "left" }}>
            {imageList.map((image) => (
              <li key={image}>{image}</li>
            ))}
          </ul>

          <h2>Fetch or Upload Image</h2>

          <div className="image-actions">
          {/* Fetch Image from Path */}
          <div className="form-group fetch-section">
            <label>Enter Image Path:</label>
            <input
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              placeholder="Enter image name..."
              disabled={selectedFile !== null}
            />
            <button onClick={handleFetchImage} disabled={!imagePath}>Fetch</button>
          </div>

          {/* Upload Image */}
          <div className="form-group upload-section">
            <label>Upload Image:</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="result">
            <img
              src={imageUrl}
              alt="Preview"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}

        </section>

        {/* Exif Extraction */}
        {imageUrl && (
          <section className="section">
            <ExifForm
              axiosInstance={axiosInstance}
              imagePath={imagePath}
              selectedFile={selectedFile}
              setExifData={setExifData}
              setQuerySent={setQuerySent}
            />
          </section>
        )}

        {Object.keys(exifData).length > 0 ? (
          <section className="section">
            <h2>EXIF Data</h2>
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(exifData).map(([field, value]) => (
                  <tr key={field}>
                    <td>{field}</td>
                    <td>{Array.isArray(value) ? value.join(", ") : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (querySent && <div>No EXIF data found</div>)
        }
      </div>
    </div>
  );
}

export default App;
