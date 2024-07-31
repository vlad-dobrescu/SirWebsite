require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');

const credentialsPath = path.resolve(process.env.GOOGLE_APP_CREDENTIALS);
if (!fs.existsSync(credentialsPath)) {
  console.error('Google Cloud credentials file not found:', credentialsPath);
  process.exit(1);
}

// Configure Google Cloud Storage
const gcs = new Storage({
  keyFilename: credentialsPath
});
const bucket = gcs.bucket(process.env.BUCKET_NAME);

const uploadToGcs = async (file) => { // Upload file to Google Cloud Storage
  const fileName = `${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype
    }
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));
    stream.on('finish', () => resolve(`https://storage.googleapis.com/${process.env.BUCKET_NAME}/${fileName}`));
    stream.end(file.buffer);
  });
};

module.exports = uploadToGcs;