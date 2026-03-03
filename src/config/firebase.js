const admin = require('firebase-admin');

const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
// Ideally, use environment variables to load credentials in production
const initializeFirebase = () => {
    try {
        const servicePath = path.join(__dirname, '../../google-services.json');

        if (fs.existsSync(servicePath)) {
            const googleServices = JSON.parse(fs.readFileSync(servicePath, 'utf8'));
            const projectId = googleServices.project_info.project_id;

            admin.initializeApp({ projectId });
            console.log(`Firebase Admin initialized successfully for project: ${projectId}`);
        } else {
            // Fallback or explicit env config
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin initialized successfully using ENV credentials');
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
};

module.exports = { admin, initializeFirebase };
