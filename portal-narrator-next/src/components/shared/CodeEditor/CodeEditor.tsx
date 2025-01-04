import { BasicEditor } from '@narratorai/the-sequel'

interface Props {
  value: string
  language: 'json' | 'redshift' | 'sql' | 'python' | 'javascript' | 'typescript' | 'markdown' | 'plaintext'
  disabled?: boolean
  height?: number | string
}

const CodeEditor = ({ language, value, height, disabled }: Props) => {
  return (
    <BasicEditor
      language={language}
      value={value}
      height={height}
      options={{ wordWrap: 'off', fontSize: 14 }}
      disabled={disabled}
    />
  )
}

export default CodeEditor
