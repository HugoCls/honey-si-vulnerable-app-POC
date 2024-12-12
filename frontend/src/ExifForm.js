import React, { useState } from 'react';

// Define EXIF fields with prefixes for JSONPath queries
const exifFields = {
    Image: ["ImageWidth", "ImageHeight", "Make", "Model", "DateTimeOriginal", "Orientation", "XResolution", "YResolution", "XPosition", "YPosition", "ExifTag"],
    Photo: ["FocalLength", "ApertureValue", "ISO"],
    GPSInfo: ["GPSLatitude", "GPSLongitude"]
};

const ExifForm = ({ axiosInstance, imagePath, setExifData }) => {
    const [selectedFields, setSelectedFields] = useState([]);
    const [checkAll, setCheckAll] = useState({
        Image: false,
        Photo: false,
        GPSInfo: false
    });

    // Handle checkbox toggle
    const handleCheckboxChange = (prefix, field) => {
        const fullField = `${prefix}.${field}`;
        setSelectedFields((prev) =>
            prev.includes(fullField)
                ? prev.filter((item) => item !== fullField)
                : [...prev, fullField]
        );
    };

    // Handle "Check All" toggle for each prefix
    const handleCheckAll = (prefix) => {
        if (checkAll[prefix]) {
            setSelectedFields((prev) =>
                prev.filter((item) => !item.startsWith(`${prefix}.`))
            );
        } else {
            const newFields = exifFields[prefix].map((field) => `${prefix}.${field}`);
            setSelectedFields((prev) => [...prev, ...newFields]);
        }
        setCheckAll((prev) => ({ ...prev, [prefix]: !prev[prefix] }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const jsonPathQuery = selectedFields.map((field) => `$..${field}`);
            const response = await axiosInstance.post(
                '/query',
                {
                    imagePath,
                    query: jsonPathQuery
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            setExifData(response.data.extractedData);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                padding: '20px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                maxWidth: '600px',
                margin: 'auto',
                backgroundColor: '#f9f9f9'
            }}
        >
            <h3 style={{ textAlign: 'center', color: '#333' }}>
                Select EXIF Fields to Query
            </h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                {Object.entries(exifFields).map(([prefix, fields]) => (
                    <div
                        key={prefix}
                        style={{
                            flex: '1',
                            border: '1px solid #ddd',
                            padding: '10px',
                            borderRadius: '5px',
                            backgroundColor: '#fff'
                        }}
                    >
                        <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>{prefix}</h4>
                        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', fontWeight: 'bold', color: '#007bff' }}>
                            <input
                                type="checkbox"
                                checked={checkAll[prefix]}
                                onChange={() => handleCheckAll(prefix)}
                                style={{ marginRight: '10px' }}
                            />
                            Check All
                        </label>
                        {fields.map((field) => (
                            <label
                                key={field}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '5px'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    value={`${prefix}.${field}`}
                                    checked={selectedFields.includes(`${prefix}.${field}`)}
                                    onChange={() => handleCheckboxChange(prefix, field)}
                                    style={{ marginRight: '10px' }}
                                />
                                {field}
                            </label>
                        ))}
                    </div>
                ))}
            </div>
            <button
                type="submit"
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                Submit Query
            </button>
        </form>
    );
};

export default ExifForm;
