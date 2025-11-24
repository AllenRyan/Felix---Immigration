import type { Metadata } from "next";
import { ChatKitScript } from "@/components/ChatKitScript";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspra AI - Your personal chat companion",
  description: "Inspra AI - Your personal chat companion powered by OpenAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ChatKitScript />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
