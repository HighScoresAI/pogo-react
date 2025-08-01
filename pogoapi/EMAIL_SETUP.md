# Email Setup Guide for Hello Pogo

## Step-by-Step Gmail Configuration

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **"Security"** in the left sidebar
3. Find **"2-Step Verification"** and click on it
4. Follow the steps to enable 2-factor authentication on your Gmail account

### Step 2: Generate App Password
1. After enabling 2-factor authentication, go back to **"Security"**
2. Find **"App passwords"** (it appears after enabling 2FA)
3. Click on **"App passwords"**
4. Select **"Mail"** from the dropdown
5. Click **"Generate"**
6. **Copy the 16-character password** that appears (it looks like: `abcd efgh ijkl mnop`)

### Step 3: Set Environment Variables

Create a `.env` file in the `pogoapi` folder with these variables:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=hellopogo-529ca
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
JWT_SECRET_KEY=xYNHjQ6ndrU7TERYtkU4QmKtJpw6Z3yzjlrhsxHBWxgYzDnRPxCPmUvaUhJMG1WCFq1rDWeYs22dvwTq9NyEaQ==

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pogo_db

# Other configurations
SECRET_KEY=your-flask-secret-key-change-this-in-production
```

### Step 4: Replace Placeholder Values

Replace these values in your `.env` file:

- `your-email@gmail.com` → Your actual Gmail address
- `your-16-digit-app-password` → The 16-character app password you generated

### Step 5: Restart the Backend

After setting up the `.env` file, restart your backend server:

```bash
cd pogoapi
python main.py
```

### Step 6: Test Email Sending

1. Go to your login page
2. Enter your email address
3. Click "Continue"
4. Check your email inbox for the passcode

## Troubleshooting

### If emails don't send:
1. Check that 2-factor authentication is enabled
2. Verify the app password is correct (16 characters, no spaces)
3. Make sure the `.env` file is in the `pogoapi` folder
4. Restart the backend server after making changes

### If you get authentication errors:
1. Double-check your Gmail address
2. Make sure you're using the app password, not your regular Gmail password
3. Ensure the app password was generated for "Mail" specifically 