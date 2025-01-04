import bash from 'highlight.js/lib/languages/bash'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import php from 'highlight.js/lib/languages/php'
import python from 'highlight.js/lib/languages/python'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { createLowlight } from 'lowlight'

export const lowlightInstance = createLowlight({
  bash,
  cpp,
  csharp,
  css,
  diff,
  go,
  java,
  javascript,
  json,
  php,
  python,
  ruby,
  rust,
  sql,
  typescript,
  xml,
})

export const availableLanguages = [
  {
    value: 'bash',
    label: 'Bash',
  },
  {
    value: 'cpp',
    label: 'C++',
  },
  {
    value: 'csharp',
    label: 'C#',
  },
  {
    value: 'css',
    label: 'CSS',
  },
  {
    value: 'diff',
    label: 'Diff',
  },
  {
    value: 'go',
    label: 'Go',
  },
  {
    value: 'java',
    label: 'Java',
  },
  {
    value: 'js',
    label: 'JavaScript',
  },
  {
    value: 'json',
    label: 'JSON',
  },
  {
    value: 'php',
    label: 'PHP',
  },
  {
    value: 'python',
    label: 'Python',
  },
  {
    value: 'ruby',
    label: 'Ruby',
  },
  {
    value: 'rust',
    label: 'Rust',
  },
  {
    value: 'sql',
    label: 'SQL',
  },
  {
    value: 'typescript',
    label: 'TypeScript',
  },
  {
    value: 'xml',
    label: 'XML',
  },
]
