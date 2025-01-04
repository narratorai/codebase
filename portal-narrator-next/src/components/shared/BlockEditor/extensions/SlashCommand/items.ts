import { Editor, Range } from '@tiptap/react'
import {
  RiCodeBlock,
  RiDoubleQuotesL,
  RiFile2Line,
  RiFilter2Line,
  RiGridLine,
  RiH1,
  RiH2,
  RiH3,
  RiHonourLine,
  RiLineChartLine,
  RiListCheck3,
  RiListOrdered2,
  RiListUnordered,
  RiPieChartBoxLine,
  RiSparkling2Fill,
  RiSubtractFill,
  RiTable2,
  RiTableLine,
} from 'react-icons/ri'

interface SuggestionCommandArgs {
  editor: Editor
  range: Range
}

export type SlashCommandItem = {
  title: string
  Icon: JSX.ElementType
  tags: string[]
  command: ({ editor, range }: SuggestionCommandArgs) => void
  category: string
}

const allItems: SlashCommandItem[] = [
  {
    title: 'Plot',
    Icon: RiLineChartLine,
    tags: ['plot', 'chart', 'dataset'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setPlot().run()
    },
    category: 'Data',
  },
  {
    title: 'Data Table',
    Icon: RiTable2,
    tags: ['data', 'table', 'dataset'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDataTable().run()
    },
    category: 'Data',
  },
  {
    title: 'Filter',
    Icon: RiFilter2Line,
    tags: ['filter', 'dataset'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setFilter().run()
    },
    category: 'Data',
  },
  {
    title: 'Decision',
    Icon: RiSparkling2Fill,
    tags: ['decision', 'dataset', 'ai', 'prompt'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDecision().run()
    },
    category: 'Data',
  },
  {
    title: 'Dataset Metric',
    Icon: RiPieChartBoxLine,
    tags: ['metric', 'dataset', 'aggregate', 'sum', 'average', 'count'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDatasetMetric().run()
    },
    category: 'Data',
  },
  {
    title: '2 Columns',
    Icon: RiGridLine,
    tags: ['columns', 'grid', 'layout', 'split', 'half'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalGrid(2).run()
    },
    category: 'Layout',
  },
  {
    title: '3 Columns',
    Icon: RiGridLine,
    tags: ['columns', 'grid', 'layout', 'split', 'third'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalGrid(3).run()
    },
    category: 'Layout',
  },
  {
    title: '4 Columns',
    Icon: RiGridLine,
    tags: ['columns', 'grid', 'layout'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalGrid(4).run()
    },
    category: 'Layout',
  },
  {
    title: '5 Columns',
    Icon: RiGridLine,
    tags: ['columns', 'grid', 'layout'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalGrid(5).run()
    },
    category: 'Layout',
  },
  {
    title: 'Heading 1',
    Icon: RiH1,
    tags: ['h1', 'title', 'big', 'large'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
    category: 'Format',
  },
  {
    title: 'Heading 2',
    Icon: RiH2,
    tags: ['h2', 'title', 'heading', 'medium'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
    category: 'Format',
  },
  {
    title: 'Heading 3',
    Icon: RiH3,
    tags: ['h3', 'title', 'heading', 'small'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
    category: 'Format',
  },
  {
    title: 'Callout',
    Icon: RiHonourLine,
    tags: ['callout', 'info', 'note', 'tip', 'warning', 'danger'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout().run()
    },
    category: 'Format',
  },
  {
    title: 'Numbered List',
    Icon: RiListOrdered2,
    tags: ['ol', 'list', 'numbered', 'ordered', 'numeric'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
    category: 'Format',
  },
  {
    title: 'Bulleted List',
    Icon: RiListUnordered,
    tags: ['ul', 'list', 'bulleted', 'unordered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
    category: 'Format',
  },
  {
    title: 'Task List',
    Icon: RiListCheck3,
    tags: ['list', 'todo', 'task', 'checklist', 'checkbox'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
    category: 'Format',
  },
  {
    title: 'Divider',
    Icon: RiSubtractFill,
    tags: ['hr', 'divider', 'line', 'horizontal rule', 'separator', 'break'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
    category: 'Format',
  },
  {
    title: 'Code',
    Icon: RiCodeBlock,
    tags: ['pre', 'code', 'syntax', 'snippet', 'highlight', 'sql', 'python', 'javascript', 'json'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run()
    },
    category: 'Format',
  },
  {
    title: 'Table',
    Icon: RiTableLine,
    tags: ['table', 'data', 'matrix'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()
    },
    category: 'Format',
  },
  {
    title: 'Quote',
    Icon: RiDoubleQuotesL,
    tags: ['blockquote', 'quote', 'citation', 'reference'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run()
    },
    category: 'Format',
  },
  {
    title: 'File',
    Icon: RiFile2Line,
    tags: ['file', 'media', 'attachment', 'download'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setFilePlaceholder().run()
    },
    category: 'Media',
  },
]

export default allItems
