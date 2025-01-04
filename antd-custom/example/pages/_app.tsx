import React from 'react'
import Head from 'next/head'
import { AppProps } from 'next/app'

import "antd/dist/antd.less"
import "@narratorai/antd-custom/antd-custom.cjs.development.css"

export default function App(props: AppProps) {
  const { Component, pageProps } = props

  return (
    <React.Fragment>
      <Head>
        <link
          href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700"
          rel="stylesheet"
        />
      </Head>

      <Component {...pageProps} />
    </React.Fragment>
  )
}
