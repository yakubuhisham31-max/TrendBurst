import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

async function testR2() {
  try {
    const result = await s3.listBuckets().promise();
    console.log('✅ Connection successful!');
    console.log(result);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testR2();
