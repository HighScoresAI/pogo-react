# Firebase Setup for PogoAPI Backend

This guide explains how to set up Firebase Authentication in the PogoAPI backend to work with your existing UI.

## Overview

The backend now supports Firebase Authentication while storing user data in MongoDB. This provides:
- Secure authentication via Firebase
- User data storage in MongoDB
- JWT token generation for your application
- Seamless integration with existing UI

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication in the Firebase console
4. Add Authentication methods:
   - Email/Password
   - Google (recommended)

### 2. Get Firebase Service Account

1. In Firebase Console, go to Project Settings
2. Go to Service Accounts tab
3. Click "Generate new private key"
4. Download the JSON file
5. Save it as `firebase-service-account.json` in the `pogoapi` folder

### 3. Configure Environment Variables

Add these environment variables to your `.env` file or system:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
FIREBASE_CREDENTIALS={"type":"service_account",...}  # Optional: JSON string

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# MongoDB Configuration (existing)
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pogo_db
```

### 4. Install Dependencies

```bash
cd pogoapi
pip install -r requirements.txt
```

## API Endpoints

### Firebase Authentication

#### POST `/auth/firebase`
Authenticate user with Firebase ID token.

**Request:**
```json
{
  "id_token": "firebase_id_token_here"
}
```

**Response:**
```json
{
  "userId": "mongodb_user_id",
  "firebase_uid": "firebase_user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "access_token": "jwt_token_for_your_app",
  "message": "Authentication successful"
}
```

#### POST `/auth/firebase/signup`
Create user with email/password in Firebase and MongoDB.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "acceptTerms": true
}
```

#### POST `/auth/firebase/verify`
Verify Firebase ID token and return user info.

**Request:**
```json
{
  "id_token": "firebase_id_token_here"
}
```

#### GET `/auth/firebase/user/<user_id>`
Get user information from MongoDB.

#### PUT `/auth/firebase/profile`
Update user profile in MongoDB.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "profile_picture": "https://example.com/picture.jpg"
}
```

## Frontend Integration

### 1. Initialize Firebase in Frontend

Add Firebase SDK to your frontend and initialize:

```javascript
// Initialize Firebase
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};

firebase.initializeApp(firebaseConfig);
```

### 2. Update Authentication Flow

Modify your login/register components to use Firebase:

```javascript
// Login with Firebase
const signInWithFirebase = async (email, password) => {
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Send token to your backend
    const response = await fetch('/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    });
    
    const data = await response.json();
    // Store the JWT token from your backend
    localStorage.setItem('access_token', data.access_token);
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. Google Sign-In

```javascript
const signInWithGoogle = async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await firebase.auth().signInWithPopup(provider);
    const idToken = await userCredential.user.getIdToken();
    
    // Send token to your backend
    const response = await fetch('/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    });
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Database Schema

### Users Collection (MongoDB)

```json
{
  "_id": "ObjectId",
  "firebase_uid": "firebase_user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "email_verified": true,
  "provider": "google",
  "profile_picture": "https://example.com/picture.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "is_active": true,
  "organizations": [],
  "preferences": {
    "theme": "light",
    "notifications": true
  }
}
```

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret key for JWT tokens
2. **Firebase Rules**: Configure Firebase Security Rules properly
3. **Environment Variables**: Never commit sensitive data to version control
4. **HTTPS**: Use HTTPS in production
5. **Token Expiration**: Configure appropriate token expiration times

## Testing

### Test Firebase Authentication

1. Start your backend server
2. Use the Firebase endpoints to test authentication
3. Verify user creation in both Firebase and MongoDB
4. Test JWT token generation and verification

### Example Test Request

```bash
curl -X POST http://localhost:5000/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"id_token": "your_firebase_id_token"}'
```

## Troubleshooting

### Common Issues

1. **Firebase initialization failed**: Check service account credentials
2. **JWT token invalid**: Verify JWT secret key configuration
3. **MongoDB connection failed**: Check MongoDB URL and credentials
4. **CORS errors**: Ensure CORS is properly configured

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export FLASK_DEBUG=1
```

## Migration from Existing Auth

If you're migrating from the existing authentication system:

1. Keep existing endpoints for backward compatibility
2. Gradually migrate users to Firebase authentication
3. Update frontend to use Firebase endpoints
4. Test thoroughly before removing old endpoints

## Support

For issues or questions:
1. Check Firebase Console for authentication logs
2. Review backend logs for detailed error messages
3. Verify environment variable configuration
4. Test with Firebase Admin SDK directly 