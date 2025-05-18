import './globals.css';
import PageTransition from '../components/PageTransition';

// This must remain a server component
export const metadata = {
  title: 'IndyChat',
  description: 'Chatbot for Indianapolis',
  icons: {
    icon: '/images/indianapolis.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-mont">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}
