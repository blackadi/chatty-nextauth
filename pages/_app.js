import Head from "next/head";
import "../styles/globals.css";
import { SessionProvider } from "next-auth/react"
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { Outfit} from "next/font/google";
config.autoAddCss = false;

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

function App({ Component, pageProps: { session, ...pageProps }}) {
  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
        <main className={`${outfit.variable} font-body`}>
          <Component {...pageProps} />
        </main>
    </SessionProvider>
  );
}

export default App;
