import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import ExifForm from "./ExifForm";

function App() {
  const [imagePath, setImagePath] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [exifData, setExifData] = useState({});

  const backendUrl = process.env.REACT_APP_BACKEND_URL; // Use the environment variable

  const axiosInstance = axios.create({
    baseURL: backendUrl,
  });

  const handleFetchImage = async () => {
    if (!imagePath) {
      alert("Please enter an image path.");
      return;
    }

    try {
      const response = await axiosInstance.get("/api/fetch-image", {
        params: { path: imagePath },
        responseType: "arraybuffer",
      });

      const imageBlob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      setImageUrl(URL.createObjectURL(imageBlob));
    } catch (error) {
      console.error("Error fetching image:", error);
      alert("Failed to fetch the image.");
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
          <h2>Fetch Image</h2>
          <div className="form-group">
            <label>Enter Image Path:</label>
            <input
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              placeholder="200/300"
            />
            <button onClick={handleFetchImage}>Fetch</button>
          </div>
          {imageUrl && (
            <div className="result">
              <img
                src={imageUrl}
                alt="Fetched"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          )}
        </section>
        {imageUrl && (
          <section className="section">
            <ExifForm axiosInstance={axiosInstance} imagePath={imagePath} setExifData={setExifData} />
          </section>
        )}
        {Object.keys(exifData).length > 0 && (
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
                    <td>{Array.isArray(value) ? value.join(', ') : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;