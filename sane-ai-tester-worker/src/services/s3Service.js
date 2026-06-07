const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

// Load environment variables — resolve .env relative to this file (src/services/) -> project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

class S3Service {
    constructor() {
        const credentials = {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        };

        const endpoint = process.env.R2_ENDPOINT;
        this.bucketName = process.env.R2_BUCKET_NAME || 'sane-ai-tester';
        this.publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-cb1eb173f59642cab6c712344a37c507.r2.dev';

        if (credentials.accessKeyId && credentials.secretAccessKey && endpoint) {
            this.s3Client = new S3Client({
                region: 'auto',
                endpoint: endpoint,
                credentials: credentials,
                forcePathStyle: true
            });
            logger.info("✅ Cloudflare R2/S3 Client initialized successfully");
        } else {
            logger.warn("⚠️ Cloudflare R2/S3 credentials missing from environment. Uploads will be skipped.");
            this.s3Client = null;
        }
    }

    /**
     * Detect MIME type and R2 key prefix based on file extension.
     * @param {string} filePath - Path to the file
     * @returns {{ mimeType: string, keyPrefix: string }}
     */
    _detectFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.png':
                return { mimeType: 'image/png', keyPrefix: 'recordings/screenshots' };
            case '.jpg':
            case '.jpeg':
                return { mimeType: 'image/jpeg', keyPrefix: 'recordings/screenshots' };
            case '.webm':
                return { mimeType: 'video/webm', keyPrefix: 'recordings/videos' };
            case '.mp4':
                return { mimeType: 'video/mp4', keyPrefix: 'recordings/videos' };
            default:
                return { mimeType: 'application/octet-stream', keyPrefix: 'recordings/other' };
        }
    }

    /**
     * Upload a local file to Cloudflare R2.
     * Auto-detects MIME type and key prefix from file extension.
     * @param {string} filePath - Absolute path to the local file
     * @param {string} [mimeTypeOverride] - Optional MIME type override
     * @returns {Promise<string|null>} - Public URL of the uploaded file or null
     */
    async uploadFile(filePath, mimeTypeOverride) {
        if (!this.s3Client) {
            logger.warn("⚠️ S3 Client not initialized, skipping upload.");
            return null;
        }

        try {
            if (!(await fs.pathExists(filePath))) {
                logger.error(`❌ Local file not found for upload: ${filePath}`);
                return null;
            }

            const fileBuffer = await fs.readFile(filePath);
            const fileName = path.basename(filePath);
            
            // Auto-detect type or use override
            const detected = this._detectFileType(filePath);
            const mimeType = mimeTypeOverride || detected.mimeType;
            const keyPrefix = detected.keyPrefix;
            
            // Unique destination key using timestamp + original name
            const key = `${keyPrefix}/${Date.now()}_${fileName}`;

            logger.info(`📤 Uploading file to R2: ${key} (${mimeType})...`);

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType
            });

            await this.s3Client.send(command);

            const uploadedUrl = `${this.publicUrl.replace(/\/$/, '')}/${key}`;
            logger.info(`✅ File uploaded successfully: ${uploadedUrl}`);
            return uploadedUrl;

        } catch (error) {
            logger.error(`❌ Cloudflare R2 upload failed: ${error.message}`);
            return null;
        }
    }
}

module.exports = new S3Service();
