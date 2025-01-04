import { isEmpty, isString } from 'lodash'
import sanitize from 'util/sanitize'

interface Props {
  value: any
  snippet?: string
}

const Mark = ({ value = '', snippet = '' }: Props) => {
  const cleanSnippet = snippet.replace(/[\W]+/g, ' ')
  if (!isString(value) || isEmpty(cleanSnippet)) {
    return value
  }

  const snippetParts = cleanSnippet.split(' ')
  const regex = new RegExp(`(${snippetParts.join('|')})`, 'ig')
  const replacer = value.replace(regex, `<mark style="padding:0;background-color:#ff0;">$1</mark>`)

  return (
    <span
      dangerouslySetInnerHTML={{
        // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
        __html: sanitize(replacer),
      }}
    />
  )
}

export default Mark
