import "../globals.css";
import type { AppProps } from "next/app";
import { Noto_Sans } from "next/font/google";

const noto = Noto_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={noto.className}>
      <Component {...pageProps} />
    </main>
  );
}
