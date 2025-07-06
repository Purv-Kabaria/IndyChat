# 🏙️ Indianapolis Digital Assistant for Civic Engagement and City Services — IndyChat

**IndyChat** is a scalable, AI-powered chatbot platform designed to assist the residents, workers, and visitors of **Indianapolis, Indiana**. Built for the [Chatbot for Public Safety Hackathon](https://chatbot-for-public-safety.devpost.com/), the project bridges the gap between people and the city’s public services using a modern tech stack, real-time information delivery, and intelligent civic engagement tools.

> 🔗 Live: [indychat.vercel.app](https://indychat.vercel.app)  
> 💻 GitHub: [github.com/Purv-Kabaria/IndyChat](https://github.com/Purv-Kabaria/IndyChat)

---

## 🌟 Highlights

- AI chatbot powered by Dify with Retrieval-Augmented Generation (RAG)
- Complaint and report submission through chat
- TTS/STT support via ElevenLabs
- Google Maps + city image embeds
- Admin dashboard for monitoring, publishing, user and data management

---

## 💡 Key Features

### 🗨️ Smart Chat Interface
- Built with `shadcn/ui` and modeled after ChatGPT’s layout
- Context-aware, locality-specific query handling
- Temporary and saved chat history support

### 📍 City Info + Navigation
- Live Google Maps directions
- Images and metadata of Indianapolis landmarks
- Event, safety, transit, and service-based Q&A

### 🛠️ Admin Panel
- Upload PDFs as bot knowledge base (RAG-ready)
- View/manage users, complaints, and conversation logs
- Create city-wide announcements and blog posts

### 🎙️ Voice Support
- **Text-to-Speech** and **Speech-to-Text** via **ElevenLabs**

---

## 🛠️ Tech Stack

**Frontend:**  
- `Next.js 15` (App Router, Server Actions, Edge Functions)  
- `TypeScript`, `Tailwind CSS v3`, `shadcn/ui`

**Backend:**  
- `Firebase Auth`, `Firestore`, `Cloud Functions`  
- `Dify AI` with custom prompt design  
- `Cloudinary` for image handling  
- `ElevenLabs` for voice services

**Deployment:**  
- Hosted on `Vercel`

---

## ⚙️ Local Setup Instructions

> ⚠️ For casual users, use the [live site](https://indychat.vercel.app). Local setup requires Firebase/Dify credentials and some configuration effort.

### 1. Clone the Repository

```bash
git clone https://github.com/Purv-Kabaria/IndyChat
cd IndyChat
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Setup Environment Variables

Create a `.env.local` file and configure:

- Firebase project settings (API key, Auth domain, DB URL, etc.)
- Dify API keys
- ElevenLabs API key
- Cloudinary keys

> This also requires setting up Firestore indexes and OAuth redirect domains in Firebase Console.

### 4. Run Dev Server

```bash
npm run dev
# or
pnpm dev
```

---

## 🧪 Test Accounts

**Admin:**  
- Email: `xofefa@azuretechtalk.net`  
- Password: `admin12345678`

**User:**  
- Email: `gotuha@polkaroad.net`  
- Password: `user12345678`

---

## 📁 Project Structure

```
/app              → App Router-based pages and layouts (Next 15)
/components       → Reusable UI components
/lib              → Firebase & utility logic
/pages/api        → API endpoints (server functions)
/public           → Static assets and images
/styles           → Tailwind base + global styles
```

---

## 🚀 Deployment

Deployed using **Vercel** with automatic CI from GitHub.  
Ensure `.env` variables are securely configured in Vercel’s dashboard for production.
An example `.env.example` file is given in the repository.

---

## 👨‍💻 Team

- **Purv Kabaria**  
- Rushang Bagada  
- Gaurav Damor  
- Jenil Prajapati  
- Krishna Tahiliani