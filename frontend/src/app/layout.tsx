import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TestApi | API Testing & Performance Analysis Platform",
  description: "High-performance API testing, load benchmarking, and analytics platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>TestApi • Engineering Final Year Capstone Project</p>
              <p>FastAPI (Python 3.11+) + PostgreSQL 16 + Next.js App Router</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
