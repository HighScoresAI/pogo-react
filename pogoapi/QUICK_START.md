# Quick Start Guide - PogoAPI with Firebase

This guide will help you get the PogoAPI backend running quickly with Firebase authentication.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd pogoapi
pip install -r requirements.txt
```

### 2. Set Up Environment
```bash
python setup_env.py
```

This will:
- Create a `.env` file with default configuration
- Check MongoDB connection
- Verify Firebase setup

### 3. Start MongoDB (if not running)
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 4. Run the Server
```bash
python -m pogoapi.main
```

The server should start on `http://localhost:5000`

## 🔧 Configuration Options

### Basic Setup (MongoDB only)
The server will work with just MongoDB configured. Firebase endpoints will return helpful error messages.

### Full Setup (MongoDB + Firebase)
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password, Google)
3. Download service account JSON
4. Save as `firebase-service-account.json` in the `pogoapi` folder

## 📋 Available Endpoints

### Existing Endpoints (still work)
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/verify` - Verify token

### New Firebase Endpoints
- `POST /auth/firebase` - Authenticate with Firebase token
- `POST /auth/firebase/signup` - Create user with Firebase
- `POST /auth/firebase/verify` - Verify Firebase token
- `GET /auth/firebase/user/<id>` - Get user info
- `PUT /auth/firebase/profile` - Update user profile

## 🧪 Testing

### Test Basic Setup
```bash
python test_firebase_setup.py
```

### Test API Endpoints
```bash
# Test existing auth
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"test@example.com","password":"password123","acceptTerms":true}'

# Test Firebase auth (when configured)
curl -X POST http://localhost:5000/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"id_token":"your_firebase_token"}'
```

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Make sure MongoDB is running
   - Check if the URL in config.yaml is correct

2. **Firebase Not Configured**
   - This is normal for development
   - Firebase endpoints will return helpful error messages
   - Follow the setup guide to enable Firebase

3. **Import Errors**
   - Make sure you're in the `pogoapi` directory
   - Run `pip install -r requirements.txt`

### Debug Mode
```bash
export FLASK_DEBUG=1
python -m pogoapi.main
```

## 📚 Next Steps

1. **Frontend Integration**: Update your React app to use Firebase
2. **Production Setup**: Configure proper environment variables
3. **Security**: Set up proper JWT secrets and Firebase rules
4. **Testing**: Add comprehensive test coverage

## 📞 Support

- Check the logs for detailed error messages
- Review the `FIREBASE_SETUP.md` for detailed configuration
- Test with the provided test scripts 