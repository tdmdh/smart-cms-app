import "../src/styles/globals.css";
import "../src/styles/main.scss";
import { StoreProvider } from "@/src/store/provider";
import { ToastProvider } from "@/src/components/shared/ui";
import { QueryProvider } from "@/src/providers/QueryProvider";
import { AuthBootstrap } from "@/src/providers/AuthBootstrap";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700", "800"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className={plusJakarta.className}>
        <QueryProvider>
          <StoreProvider>
            <ToastProvider>
              <AuthBootstrap />
              {children}
            </ToastProvider>
          </StoreProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
