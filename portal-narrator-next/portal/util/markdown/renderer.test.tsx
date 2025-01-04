import { render, waitFor } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { rebassTheme } from 'util/constants'

import Renderer from './renderer'

jest.mock('components/shared/VideoPlayer', () => ({
  VideoPlayer: (props: { title: string; url: string }) => {
    return <div data-test="mocked-video-player" {...props} />
  },
}))

const renderMarkdown = async (source: string | null) => {
  const rendered = render(
    <ThemeProvider theme={rebassTheme}>
      <Renderer source={source} />
    </ThemeProvider>,
    // react-remark does not support React-DOM 18
    { legacyRoot: true }
  )

  // Remark does some internl waiting and state setting, wait for it to render something before
  await waitFor(() => rendered.container.childNodes.length > 0)
  return rendered
}

describe.skip('#MarkdownRenderer', () => {
  it('handles empty input', async () => {
    const { container } = await renderMarkdown(null)
    expect(container).toMatchInlineSnapshot(`<div />`)
  })

  it('handles basic input', async () => {
    const { container } = await renderMarkdown('# hi')
    expect(container).toMatchInlineSnapshot(`
      .c0 {
        box-sizing: border-box;
        margin-bottom: 8px;
        font-size: 2em;
      }

      .c1 {
        font-weight: 600;
        line-height: initial;
      }

      <div>
        <h1
          class="c0 c1"
          font-size="2em"
          font-weight="semiBold"
          id="user-content-hi"
          style="font-style: normal;"
        >
          hi
        </h1>
      </div>
    `)
  })

  it('escapes malicious html', async () => {
    const { container } = await renderMarkdown(`
<a href="&#106;avascript:alert('Successful XSS')">Click this link!</a>
    
<a href="http://example.com/attack.html" style="display: block; z-index: 100000; opacity: 0.5; position: fixed; top: 0px; left: 0; width: 1000000px; height: 100000px; background-color: red;"> </a> 
    `)

    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          <a
            rel="noopener noreferrer"
            target="_blank"
          >
            Click this link!
          </a>
        </p>
        

        <p>
          <a
            href="http://example.com/attack.html"
            rel="noopener noreferrer"
            target="_blank"
          >
             
          </a>
        </p>
      </div>
    `)
  })

  it('handles complex input', async () => {
    const { container } = await renderMarkdown(`
# title

content

> quote

- list
- items

${'```sql' + '\n' + 'SELECT * from foo.bar' + '\n' + '```'}

<span class="mavis-error">mavis error</span>
    `)
    expect(container).toMatchInlineSnapshot(`
      .c0 {
        box-sizing: border-box;
        margin-bottom: 8px;
        font-size: 2em;
      }

      .c1 {
        font-weight: 600;
        line-height: initial;
      }

      .c2 {
        position: relative;
      }

      .c2 pre {
        padding-right: 40px !important;
      }

      .c2 code {
        white-space: break-spaces !important;
      }

      .c2 .code-options {
        position: absolute;
        top: 5px;
        right: 5px;
        padding: 8px;
        opacity: 0;
        will-change: opacity;
        -webkit-transition: opacity 150ms ease-in-out;
        transition: opacity 150ms ease-in-out;
        cursor: pointer;
        background-color: white;
        color: #505152;
        border-radius: 4px;
        font-size: 15px;
      }

      .c2:hover .code-options {
        opacity: 1;
      }

      .c2 .anticon.anticon-copy {
        margin-left: 12px;
      }

      <div>
        <h1
          class="c0 c1"
          font-size="2em"
          font-weight="semiBold"
          id="user-content-title"
          style="font-style: normal;"
        >
          title
        </h1>
        

        <p>
          content
        </p>
        

        <blockquote>
          

          <p>
            quote
          </p>
          

        </blockquote>
        

        <ul>
          

          <li>
            list
          </li>
          

          <li>
            items
          </li>
          

        </ul>
        

        <div
          class="c2"
        >
          <pre
            style="color: rgb(57, 58, 52); font-family: "Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace; direction: ltr; text-align: left; white-space: pre; word-spacing: normal; word-break: normal; font-size: .9em; line-height: 1.2em; tab-size: 4; hyphens: none; padding: 1em; margin: .5em 0px; overflow: auto; border: 1px solid #dddddd; background-color: white;"
          >
            <code
              class="language-sql"
              style="color: rgb(57, 58, 52); font-family: Menlo, Monaco,"Courier New", monospace; direction: ltr; text-align: left; white-space: pre; word-spacing: normal; word-break: normal; font-size: 13px; line-height: 1.2em; tab-size: 4; hyphens: none;"
            >
              <span
                class="token"
                style="color: rgb(4, 81, 165);"
              >
                SELECT
              </span>
              <span>
                 
              </span>
              <span
                class="token"
                style="color: rgb(57, 58, 52);"
              >
                *
              </span>
              <span>
                 
              </span>
              <span
                class="token"
                style="color: rgb(4, 81, 165);"
              >
                from
              </span>
              <span>
                 foo
              </span>
              <span
                class="token"
                style="color: rgb(57, 58, 52);"
              >
                .
              </span>
              <span>
                bar
              </span>
            </code>
          </pre>
          <div
            class="code-options"
          >
            <span
              aria-label="copy"
              class="anticon anticon-copy"
              role="img"
              tabindex="-1"
            >
              <svg
                aria-hidden="true"
                data-icon="copy"
                fill="currentColor"
                focusable="false"
                height="1em"
                viewBox="64 64 896 896"
                width="1em"
              >
                <path
                  d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"
                />
              </svg>
            </span>
          </div>
        </div>
        

        <p>
          <span
            class=""
          >
            mavis error
          </span>
        </p>
      </div>
    `)
  })

  it('handles a color directive', async () => {
    const { container } = await renderMarkdown(':color[something pink]{color=red400}')
    expect(container).toMatchInlineSnapshot(`
      <div>
        <p>
          <span
            data-color="red400"
            style="color: rgb(247, 115, 116);"
          >
            something pink
          </span>
        </p>
      </div>
    `)
  })

  it('handles a color container directive', async () => {
    const { container } = await renderMarkdown(`
:::color{color=green500}
## Green header
:::
    `)
    expect(container).toMatchInlineSnapshot(`
      .c0 {
        box-sizing: border-box;
        margin-bottom: 8px;
        font-size: 1.5em;
      }

      .c1 {
        font-weight: 600;
        line-height: initial;
      }

      <div>
        <span
          data-color="green500"
          style="color: rgb(32, 176, 92);"
        >
          <h2
            class="c0 c1"
            font-size="1.5em"
            font-weight="semiBold"
            id="user-content-green-header"
            style="font-style: normal;"
          >
            Green header
          </h2>
        </span>
      </div>
    `)
  })

  it('handles a video directive', async () => {
    const { container } = await renderMarkdown(
      '::video[Learn Narrator!]{id=549e5f397e737b9add7dc10bbb065065 width=600}'
    )
    expect(container).toMatchInlineSnapshot(`
      .c0 {
        box-sizing: border-box;
        margin-left: auto;
        margin-right: auto;
        width: 600px;
      }

      .c1 {
        position: initial;
        width: 600;
        -webkit-box-flex: initial;
        -webkit-flex-grow: initial;
        -ms-flex-positive: initial;
        flex-grow: initial;
        max-width: initial;
        min-width: initial;
      }

      <div>
        <div
          class="c0 c1"
          width="600"
        >
          <div
            data-test="mocked-video-player"
            title="Learn Narrator!"
            url="https://cloudflarestream.com/549e5f397e737b9add7dc10bbb065065/manifest/video.m3u8"
          />
        </div>
      </div>
    `)
  })
})
