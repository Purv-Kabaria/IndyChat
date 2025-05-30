Project Title:
Indianapolis Digital Assistant for Civic Engagement and City Services

Overview:
This project is a city-specific AI chatbot platform designed to assist residents, workers, and visitors of Indianapolis, Indiana. The assistant provides timely, accurate, and helpful information regarding local government services, transit, events, housing, education, public safety, and more. It is intended to serve as a digital bridge between the public and the city’s extensive network of services, making city-related information and tasks more accessible and understandable.

Images:

[Home](https://i.ibb.co/pBCWbBHV/home.png)

[Chat](https://i.ibb.co/93sCPvS8/chat.png)

Platform Details:

- Web Frontend: Built using Next.js, optimized for performance and SEO, designed for easy access via desktops and tablets.
- AI Backend: Powered by Dify AI, which handles natural language understanding, response generation, and prompt orchestration using a highly customized prompt engineered for locality-specific queries and structured civic guidance.

Key Features:

1. Interactive Chatbot: Users can ask the bot questions about the city as well as anything related to safety.

2. Complaints/Reports: Users can make complaints or report emergencies within the site itself.

3. TTS and STT: IndyChat provides both text-to-speech and speech-to-text services using ElevenLabs.

4. Locations and Images: The bot can provide exact locations on google maps, and images of locations in Indianapolis too.

5. Admin Dashboard: Admins can see users' conversations with the bot, can make articles of importance in the news page, perform operations on the complaints or reports made by users, see all the users' data, and upload documents to act as the knowledge base for the chatbot. *It is up to the admins what they want to supply as the knowledge base.*

6. Chrome Extension: Users can interact with the bot across all tabs in the browser as well, for fast answers.

7. Voice Agent: Users can dial the number shown in the video to gain access to valuable information about the city, and be informed about emergencies in the city or other safety measurements.

Tech Stack:

- Frontend Web: Next.js (React, TypeScript, TailwindCSS)
- Backend Web: Firebase, Cloudinary
- AI Layer: Dify AI platform with highly customized prompt and system instructions
- Hosting/Deployment: Vercel (Web)

How to Run:

*We highly recommend you using the deployed website for easier access, as local setup will take some amount of time.*

1. Clone the repository by 'git clone https://github.com/Purv-Kabaria/IndyChat'

2. Run the command 'cd IndyChat'.

3. Run the command 'npm install' or 'pnpm install'.

4. Fill in the details to the .env file (tedious and will take time). This step will also require you to index your firestore database, allow domains, and enable oauth.

5. Run the command 'npm run dev' or 'pnpm dev'.

6. Admin Testing Account Credentials: xofefa@azuretechtalk.net, admin12345678

7. User Testing Account Credentials: gotuha@polkaroad.net, user12345678