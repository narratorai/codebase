import { Extension, Mark, Node } from '@tiptap/core'
import CharacterCount from '@tiptap/extension-character-count'
import { Color } from '@tiptap/extension-color'
import Focus from '@tiptap/extension-focus'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Superscript from '@tiptap/extension-superscript'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import StarterKit, { StarterKitOptions } from '@tiptap/starter-kit'
import AutoJoiner from 'tiptap-extension-auto-joiner'

import { IReportNodeCompileContext } from '@/stores/reports/interfaces'

import Callout from './Callout'
import CodeBlock from './CodeBlock'
import DatasetMetric from './DatasetMetric'
import DataTable from './DataTable'
import Decision from './Decision'
import DragHandle from './DragHandle'
import FileHandler from './FileHandler'
import Filter from './Filter'
import { GridExtension } from './Grid'
import NodeRange from './NodeRange'
import Placeholder from './Placeholder'
import Plot from './Plot'
import RemoteFile from './RemoteFile'
import RemoteImage from './RemoteImage'
import SlashCommand from './SlashCommand'
import UniqueId from './UniqueId'

export type TiptapExtension = Extension | Mark | Node

class ExtensionBuilder {
  extensions: TiptapExtension[] = []

  constructor(options: Partial<StarterKitOptions>) {
    const starterKit = StarterKit.configure({
      ...options,
      heading: { levels: [1, 2, 3] },
      dropcursor: { color: '#bbdefb', width: 4 },
    })

    // IMPORTANT: The editor will not work without the starter kit, so we add it by default.
    this.extensions.push(starterKit)
  }

  /**
   * Add an extension, mark or node.
   */
  add(extension: TiptapExtension) {
    this.extensions.push(extension)
    return this
  }

  build() {
    return this.extensions
  }

  /**
   * Add all the text extensions.
   */
  addTextExtensions() {
    const highlight = Highlight.configure({ multicolor: true })
    const textAlign = TextAlign.configure({ types: ['heading', 'paragraph', 'plot', 'dataTable'] })

    return this.add(Color).add(highlight).add(Superscript).add(textAlign).add(TextStyle).add(Typography).add(Underline)
  }

  /**
   * Add the table extension along with all additional required extensions to ensure
   * proper functionality.
   */
  addTable() {
    const table = Table.configure({ resizable: true, allowTableNodeSelection: true })
    return this.add(table).add(TableCell).add(TableHeader).add(TableRow)
  }

  /**
   * Add the task list extension along with all additional required extensions to ensure
   * proper functionality.
   */
  addTaskList() {
    const taskItem = TaskItem.configure({ nested: true })
    return this.add(TaskList).add(taskItem)
  }
}

/**
 * Function to get all the extensions for the block editor.
 */
export async function getAllExtensions(readOnly: boolean, compileContext: IReportNodeCompileContext) {
  const attachmentsEndpoint = '/api/attachments'

  const codeBlock = CodeBlock.configure({ defaultLanguage: 'sql' })
  const uniqueId = UniqueId.configure({ attributeName: 'uid' })
  const focus = Focus.configure({ className: 'has-focus', mode: 'all' })
  const link = Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' })
  const remoteImage = RemoteImage.configure({ baseUrl: attachmentsEndpoint })
  const remoteFile = RemoteFile.configure({ baseUrl: attachmentsEndpoint })
  const dragHandle = DragHandle.configure({ excludedTags: ['hr'] })

  const dataTable = DataTable.configure({ compileContext })
  const datasetMetric = DatasetMetric.configure({ compileContext })
  const decision = Decision.configure({ compileContext })
  const filter = Filter.configure({ compileContext })
  const plot = Plot.configure({ compileContext })

  const builder = new ExtensionBuilder({ codeBlock: false }) // Unregister the codeBlock extension because we use lowlight
    .addTextExtensions()
    .addTable()
    .addTaskList()
    .add(uniqueId)
    .add(AutoJoiner)
    .add(Callout)
    .add(CharacterCount)
    .add(decision)
    .add(GridExtension)
    .add(codeBlock)
    .add(dataTable)
    .add(datasetMetric)
    .add(filter)
    .add(FileHandler)
    .add(focus)
    .add(NodeRange)
    .add(remoteImage)
    .add(remoteFile)
    .add(link)
    .add(Placeholder)
    .add(plot)
    .add(SlashCommand)

  if (!readOnly) builder.add(dragHandle)

  return builder.build()
}
