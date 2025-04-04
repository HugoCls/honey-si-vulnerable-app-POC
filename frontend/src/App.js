import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import ExifForm from "./ExifForm";

function App() {
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const authEnabled = process.env.REACT_APP_AUTH_ENABLED === "true";

  const [imageList, setImageList] = useState([]);
  const [imagePath, setImagePath] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [invalidImage, setInvalidImage] = useState(false);
  const [exifData, setExifData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [querySent, setQuerySent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!authEnabled);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [invalidCreds, setInvalidCreds] = useState(false);

  const axiosInstance = axios.create({
    baseURL: backendUrl,
  });

  const handleAuth = async () => {
    setInvalidCreds(false);
    const response = await axiosInstance
      .post("/login", { username, password })
      .catch((error) => error.response);
    if (response.status === 200) {
      setIsLoggedIn(true);
      setInvalidCreds(false);
    } else {
      setInvalidCreds(true);
    }
  };

  const handleListImages = async () => {
    try {
      const response = await axiosInstance.get("/list-images");
      setImageList(
        response.data
          .filter((image) => image.endsWith(".jpeg"))
          .map((image) => image.split(".")[0])
      );
    } catch (error) {
      console.error("Error fetching the image list:", error);
    }
  };

  const handleFetchImage = async () => {
    setImageUrl("");
    setInvalidImage(false);

    try {
      const response = await axiosInstance.get("/fetch-image", {
        params: { path: imagePath },
        responseType: "arraybuffer",
      });

      const imageBlob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      setInvalidImage(false);
      setImageUrl(URL.createObjectURL(imageBlob));
      setSelectedFile(null);
      setQuerySent(false);
    } catch (error) {
      console.error("Error fetching image:", error);
      setInvalidImage(true);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file));
      setImagePath("");
      setQuerySent(false);
    } else {
      setSelectedFile(null);
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <div>
          <header>
            <h1>EXIF VIEWER</h1>
          </header>
          <div className="container">
            <hr />

            <section className="section">
              <h2>List sample images from bucket</h2>
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
                  <label>Enter Image name:</label>
                  <input
                    type="text"
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder="Enter image name..."
                  />
                  <button onClick={handleFetchImage} disabled={!imagePath}>
                    Fetch
                  </button>
                </div>

                {/* Upload Image */}
                <div className="form-group upload-section">
                  <label>Upload Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
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
              {invalidImage && (
                <div style={{ color: "red" }}>Invalid image</div>
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
                        <td>
                          {Array.isArray(value) ? value.join(", ") : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : (
              querySent && <div>No EXIF data found</div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            maxWidth: "30%",
            flexDirection: "column",
            margin: "auto",
          }}
        >
          <h2>Login</h2>
          <div className="form-group">
            <label>Username:</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "50%", height: "20px" }}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "50%", height: "20px" }}
            />
          </div>
          <button onClick={handleAuth}>Login</button>
          {invalidCreds && (
            <div style={{ color: "red" }}>Invalid credentials</div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
