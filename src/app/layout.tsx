import "~/styles/globals.css";

import { type Metadata } from "next";

import { UIProvider } from "~/app/provider";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Services Dashboard",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UIProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </UIProvider>
      </body>
    </html>
  );
}
