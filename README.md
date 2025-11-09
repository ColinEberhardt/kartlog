# KartLog (SvelteKit + Firebase)

A comprehensive web application for tracking go-kart performance data. Manage your karting equipment, sessions, and performance data with secure user authentication and real-time data synchronization.

## ✨ Features

- **AI Chat Assistant**: GPT-4 powered chat interface with function calling to query your tyre inventory
- **Authentication**: Email/password and Google login via Firebase Auth
- **Equipment Management**: Track tyres, engines, and circuits/tracks
- **Session Logging**: Record detailed session data including lap times, setup configurations, and race results
- **Performance Analytics**: Monitor your karting performance across different tracks and conditions
- **User Security**: Users can only access their own data
- **Responsive Design**: Mobile-friendly interface for trackside use
- **Real-time Database**: Cloud Firestore for instant data synchronization
- **Data Import**: CSV import functionality for bulk data migration

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+ or 24+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd karting-firebase
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google providers)
3. Create a Firestore database
4. Get your Firebase config from Project Settings

### 3. Configure Firebase

Update `src/lib/firebase.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Deploy Security Rules

```bash
firebase login
firebase use --add  # Select your project
firebase deploy --only firestore:rules
```

### 5. (Optional) Configure AI Chat

To enable the AI-powered chat assistant, see [AI_CHAT_SETUP.md](AI_CHAT_SETUP.md) for detailed instructions on setting up your OpenAI API key.

### 6. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔐 Security

The Firestore security rules ensure:
- Users can only read/write their own data (tyres, engines, tracks, sessions)
- All operations require authentication
- Data isolation between users

## � Security

The Firestore security rules ensure:
- Users can only read/write their own data (tyres, engines, tracks, sessions)
- All operations require authentication
- Data isolation between users

## 🚀 Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Other Platforms

The built files in `dist/` can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Firebase Commands

- `firebase serve` - Serve locally with Firebase functions
- `firebase deploy` - Deploy to Firebase
- `firebase deploy --only firestore:rules` - Deploy security rules only
- `firebase deploy --only hosting` - Deploy hosting only

## � Data Import

The project includes CSV import utilities in the `upload/` directory for migrating existing karting data:

- **Tyres**: Import tyre inventory from CSV
- **Sessions**: Import session/lap data with automatic linking to equipment and tracks
- **Bulk Operations**: Efficient batch processing for large datasets

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
