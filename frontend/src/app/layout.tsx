import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "AI Multi-Agent Career Intelligence Platform",
  description: "IIT Hackathon Winning Startup-Grade Job Automation System built with LangGraph, FastAPI, and Next.js.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
