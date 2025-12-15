const admin = require('firebase-admin');
require('dotenv').config(); // Ensure dotenv is loaded

try {
    // 1. Check if the environment variable exists
    if (!process.env.FIREBASE_ADMIN_BASE64) {
        throw new Error('FIREBASE_ADMIN_BASE64 is missing in .env file');
    }

    // 2. Decode the Base64 string
    const serviceAccountBuffer = Buffer.from(process.env.FIREBASE_ADMIN_BASE64, 'base64');
    const serviceAccountString = serviceAccountBuffer.toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountString);

    // 3. Initialize Firebase Admin
    // Check if already initialized to prevent hot-reload errors in development
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin Initialized successfully");
    }

} catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
    // Depending on your preference, you might want to process.exit(1) here
    // if your app cannot function without Firebase.
}

// Export the initialized admin instance
module.exports = admin;