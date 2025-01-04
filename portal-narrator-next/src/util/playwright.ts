import chromium from '@sparticuz/chromium'
import { chromium as playwright, LaunchOptions, PageScreenshotOptions } from 'playwright'
import { setTimeout } from 'timers/promises'

type PDFOptions = {
  headers?: Record<string, string>
  displayHeaderFooter?: boolean
  footerTemplate?: string
  format?: string
  headerTemplate?: string
  height?: string | number
  landscape?: boolean
  printBackground?: boolean
  scale?: number
  tagged?: boolean
  width?: string | number
}

type ScreenshotOptions = { headers?: Record<string, string> } & PageScreenshotOptions

async function setupBrowser(options: LaunchOptions = {}) {
  const browserOptions =
    process.env.NODE_ENV === 'production'
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
          ),
          headless: true,
          ...options,
        }
      : options

  const browser = await playwright.launch(browserOptions)
  const page = await browser.newPage({ deviceScaleFactor: 3, screen: { height: 1366, width: 1024 } })

  return { browser, page }
}

async function openPage(
  url: string,
  extraHTTPHeaders?: Record<string, string>,
  viewportSize?: {
    width: number
    height: number
  }
) {
  const { browser, page } = await setupBrowser()

  if (viewportSize) await page.setViewportSize(viewportSize)
  if (extraHTTPHeaders) await page.setExtraHTTPHeaders(extraHTTPHeaders)

  await page.goto(url, { timeout: 180_000, waitUntil: 'networkidle' })

  // Wait for 5 seconds to ensure all requests are triggered
  await setTimeout(5_000)
  await page.waitForLoadState('networkidle')

  return { browser, page }
}

/**
 * Creates a PDF of a page.
 *
 * @param url URL of the page to create PDF of
 * @param options Options to configure PDF generation
 */
export async function createPDF(url: string, options: PDFOptions = {}) {
  const { headers, ...otherOptions } = options
  const { browser, page } = await openPage(url, headers)

  const buffer = await page.pdf({
    format: 'letter',
    margin: { bottom: 20, left: 20, right: 20, top: 20 },
    printBackground: true,
    ...otherOptions,
  })
  await browser.close()

  return buffer
}

/**
 * Takes a screenshot of a page.
 *
 * @param url URL of the page to take screenshot of
 * @param type Mime type of the screenshot. Can be 'png' or 'jpeg'
 * @param options Options to configure the browser page
 */
export async function createScreenshot(url: string, type: 'png' | 'jpeg' = 'png', options: ScreenshotOptions = {}) {
  const { headers, ...otherOptions } = options
  const { browser, page } = await openPage(url, headers, { height: 768, width: 1024 })

  await page.evaluate(() => {
    const contentEl = document.querySelector('[data-export-container="true"]')
    if (contentEl) {
      document.body.classList.remove(...document.body.classList)
      document.body.replaceChildren(contentEl)
    }
  })

  const buffer = await page.screenshot({ ...otherOptions, type, scale: 'css' })
  await browser.close()

  return buffer
}
