import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <link
            rel="preload"
            href="/galiver-sans/GALS.ttf"
            as="font"
            crossOrigin=""
          />
          <link
            rel="preload"
            href="/galiver-sans/GALSB.ttf"
            as="font"
            crossOrigin=""
          />
        </Head>
        <body className="bg-gradient-to-t from-fuchsia-400 via-indigo-600 to-indigo-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
