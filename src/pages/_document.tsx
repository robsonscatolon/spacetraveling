import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@100;400&family=Roboto:wght@400;700;900&display=swap"
            rel="stylesheet"
          />
          <script async defer src="https://static.cdn.prismic.io/prismic.js?new=true&repo=spacetraveling-robsonscatolon"></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
