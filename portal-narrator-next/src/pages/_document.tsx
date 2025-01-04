// https://nextjs.org/docs/advanced-features/custom-document

import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    // from https://github.com/vercel/next.js/blob/master/examples/with-styled-components/pages/_document.js
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      }
    } finally {
      sheet.seal()
    }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta key="charset" charSet="utf-8" />
          <meta key="application-name" name="application-name" content="Narrator Portal" />
          <meta key="theme-color" name="theme-color" content="#000000" />

          {/* Prevent HTML documents from being cached */}
          <meta key="pragma" httpEquiv="pragma" content="no-cache" />
          <meta key="cache-control" httpEquiv="cache-control" content="no-cache, no-store, must-revalidate" />

          <link key="favicon" rel="shortcut icon" href="/favicon.png" />
          <link key="manifest" rel="manifest" href="/static/manifest.json" />

          {/* 
            DNS Prefetch and Pre-connect for cross-origin domains we are surely going to use
            https://developer.mozilla.org/en-US/docs/Web/Performance/dns-prefetch
           */}
          <link
            key="graph-preconnect"
            rel="preconnect"
            href={`https://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}`}
            crossOrigin="use-credentials"
          />
          <link key="graph-prefetch" rel="dns-prefetch" href={`https://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}`} />

          {/*
            Fix a CSP issue with babel/regenerator trying to eval code https://github.com/facebook/regenerator/issues/378#issuecomment-765141043
            Wthout this, the `analytics` package violates the CSP unless we allowed eval in scripts
          */}
          <script dangerouslySetInnerHTML={{ __html: `globalThis.regeneratorRuntime = undefined` }} />

          {/* Load HelpScout beacon */}
          <script
            key="helpscout-load"
            dangerouslySetInnerHTML={{
              __html: `
              !function (e, t, n) { function a() { var e = t.getElementsByTagName("script")[0], n = t.createElement("script"); n.type = "text/javascript", n.async = !0, n.src = "https://beacon-v2.helpscout.net", e.parentNode.insertBefore(n, e) } if (e.Beacon = n = function (t, n, a) { e.Beacon.readyQueue.push({ method: t, options: n, data: a }) }, n.readyQueue = [], "complete" === t.readyState) return a(); e.attachEvent ? e.attachEvent("onload", a) : e.addEventListener("load", a, !1) }(window, document, window.Beacon || function () { });
              `,
            }}
          />

          {/* Init HelpScout beacon */}
          <script
            key="helpscout-init"
            dangerouslySetInnerHTML={{
              __html: `
              window.Beacon('init', '46881e9c-8627-4042-9877-8ca45f89731e')
              `,
            }}
          />
        </Head>

        {/* the `antd-custom` class on the body allows
          us to override antd CSS with higher specificity */}
        <body className="antd-custom">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default CustomDocument
