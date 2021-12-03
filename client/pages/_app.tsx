import type { AppProps } from "next/app";
import "../styles/globals.css";
import ProcessingIndicator from "../components/ProcessingIndicator";
import { ProcessingIndicatorProvider } from "../hooks/use-processing-indicator";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ProcessingIndicatorProvider>
      <Component {...pageProps} />
      <ProcessingIndicator />
    </ProcessingIndicatorProvider>
  );
}
export default MyApp;
