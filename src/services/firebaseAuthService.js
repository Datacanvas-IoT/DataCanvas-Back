const admin = require('../config/firebaseAdmin');

const verifyToken = async (idToken) => {
    try{
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        return{
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
            name: decodedToken.name
        }
    } catch (error) {
        console.error('[FIREBASE AUTH SERVICE] Error verifying Firebase ID token:', error);

        throw new Error('Invalid Firebase ID token');
    }
}

module.exports = verifyToken;