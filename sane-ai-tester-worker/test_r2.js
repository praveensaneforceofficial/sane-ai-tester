const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testR2() {
    const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        },
        forcePathStyle: true
    });
    try {
        const data = await s3.send(new ListBucketsCommand({}));
        console.log('✅ Buckets:', data.Buckets.map(b => b.Name));
    } catch (err) {
        console.error('❌ Error listing buckets:', err.message);
    }
}

testR2();
