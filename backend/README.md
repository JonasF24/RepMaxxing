# Complete Setup Instructions

## Clone the Repository
```bash
git clone https://github.com/JonasF24/RepMaxxing.git
cd RepMaxxing
```

## Install Dependencies
```bash
npm install
```

## MongoDB Atlas Setup Guide
1. Create a MongoDB Atlas account.
2. Set up a new cluster.
3. Create a database user and whitelist your IP address.
4. Obtain your connection string.

## Gmail Email Configuration
1. Allow less secure apps in your Google account settings.
2. Use the following configuration to send emails:
   ```json
   {
     "service": "gmail",
     "auth": {
       "user": "your-email@gmail.com",
       "pass": "your-email-password"
     }
   }
   ```

## Environment Variables Documentation
- **MONGODB_URI**: Your MongoDB connection string.
- **GMAIL_USER**: Your Gmail email address.
- **GMAIL_PASS**: Your Gmail password.
- **PORT**: The port your server will run on.

## API Endpoint Reference
- **GET /api/users**: Fetch all users.
- **POST /api/users**: Create a new user.
- **GET /api/users/{id}**: Fetch user details by ID.