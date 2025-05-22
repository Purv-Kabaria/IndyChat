# IndyChat - Indianapolis Digital Assistant

A secure, scalable AI chatbot platform designed to assist residents, workers, and visitors of Indianapolis, Indiana with city services, transit information, events, and more.

## Overview

This project provides a digital bridge between the public and the city's extensive network of services, making city-related information and tasks more accessible and understandable.

## Features

- Local Government Services: Information about permits, licenses, elections, ordinances, trash pickup
- Transportation Support: Real-time route guidance, IndyGo information, BRT lines
- Housing & Utilities: Rental assistance, affordable housing programs, utility providers
- Healthcare and Public Health: Finding clinics, vaccination sites, Eskenazi Health services
- Events & Culture: Local events, museums, parks, sports, and community festivals
- Neighborhood-Specific Info: Information about specific neighborhoods
- Civic Engagement: Voting registration help, council district info, volunteer opportunities
- Text-to-Speech: Voice responses for accessibility

## Security Features

- Secure authentication with Firebase Auth
- Server-side session management with HttpOnly cookies
- Rate limiting for API endpoints
- Content Security Policy implementation
- Input validation and sanitization
- Proper error handling and logging
- Protection against common web vulnerabilities

## Tech Stack

- **Frontend**: Next.js (React, TypeScript, TailwindCSS)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Hosting**: Vercel
- **Text-to-Speech**: ElevenLabs API
- **Security**: Firebase Admin SDK, custom middleware

## Prerequisites

- Node.js 18.x or later
- Firebase account and project
- ElevenLabs API key (for TTS functionality)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/IndyChat.git
cd IndyChat
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase and ElevenLabs credentials.

4. Set up Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Generate a service account key for Firebase Admin SDK
   - Add the service account credentials to your `.env.local` file

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── api/                # API routes
│   └── ...                 # Other app routes
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and libraries
│   ├── firebase.ts         # Firebase client configuration
│   ├── firebase-server.ts  # Server-side Firebase utilities
│   └── ...                 # Other utilities
├── public/                 # Static files
└── types/                  # TypeScript type definitions
```

## Deployment

This application can be deployed to Vercel with minimal configuration:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy!

## Security Considerations

- All authentication is handled through Firebase Auth
- API routes are protected with session verification
- Rate limiting is applied to prevent abuse
- Sensitive operations require re-authentication
- All user input is validated and sanitized

## Scalability Features

- Firebase provides automatic scaling for authentication and database
- Optimized data fetching with caching strategies
- Efficient state management to minimize re-renders
- Lazy loading of components and routes
- Offline persistence for improved reliability

## License

[MIT](LICENSE)