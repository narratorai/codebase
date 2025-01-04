export const downloadCsv = ({ csvData, fileName }) => {
  // Make CSV as Blob:
  // https://www.reddit.com/r/webdev/comments/7bu0la/google_chrome_download_failed_network_error_when/dpl0t8t/
  const csvBlob = new Blob([csvData], { type: 'data:text/csv;charset=utf-8' })
  const csvUrl = URL.createObjectURL(csvBlob)

  // Download in UI:
  const link = document.createElement('a')
  link.setAttribute('href', csvUrl)
  link.setAttribute('download', `${fileName}.csv`)
  document.body.appendChild(link)
  link.click()
}
