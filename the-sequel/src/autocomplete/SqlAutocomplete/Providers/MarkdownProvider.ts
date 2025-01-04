import { CompletionKind } from '../SqlCompletionService'
import { IPosition, IRange, ITextModel } from '../../textInterfaces';
import { ICompletionContext, ICompletionItem, ICompletionResult } from '../../autocompleteInterfaces';
import { isInSqlBlock } from '../queryFunctions';

//
// Autocomplete provider for when we're in Markdown, not SQL
//

export default class MarkdownProvider {

  public triggerCharacters = ['/']
  private trigger = this.triggerCharacters[0]

  private completionItems = [
    {
      label: 'SQL Code Block',
      insertText: "```sql\nSELECT * \nFROM $0\n```",  // $0 tells it to insert the cursor there
      detail: 'Inserts a SQL code block',
      documentation: { value: "```sql\nSELECT *\nFROM \n```" },
      filterText: `${this.trigger}sql code`,
      preselect: true
    }, 
    {
      label: 'Heading 1',
      insertText: "# $0",
      detail: 'First level section heading',
      documentation: { value: "# Heading 1" },
      filterText: `${this.trigger}heading 1`
    },
    {
      label: 'Heading 2',
      insertText: "## $0",
      detail: 'Second level section heading',
      documentation: { value: "## Heading 2" },
      filterText: `${this.trigger}heading 2`
    },
    {
      label: 'Heading 3',
      insertText: "### $0",
      detail: 'Third level section heading',
      documentation: { value: "### Heading 3" },
      filterText: `${this.trigger}heading 3`
    },
    {
      label: 'Bold',
      insertText: "**$0**",
      detail: 'Bolds the text',
      documentation: { value: "When you want to **something** to stand out" },
      filterText: `${this.trigger}bold`
    },
    {
      label: 'Italics',
      insertText: "*$0*",
      detail: 'Italicizes the text',
      documentation: { value: "When you want to *emphasize* something" },
      filterText: `${this.trigger}italics`
    },
    {
      label: 'Toggle List',
      insertText: "<details>\n<summary>\n${1:summary}\n</summary>\n${2:content}\n</details>",
      detail: 'Creates content hidden inside a toggle',
      documentation: { value: "The `<summary>` tag contains the label for toggle. Everything in `<content>` is initially hidden." },
      filterText: `${this.trigger}toggle`
    },
    {
      label: 'Aside',
      insertText: "<aside>$0</aside>",
      detail: 'Emphasize text on a single line',
      documentation: { value: "`<aside>`my content`</aside>`" },
      filterText: `${this.trigger}aside`
    },
    {
      label: 'Callout',
      insertText: "> $0",
      detail: 'Emphasize a section of Markdown',
      documentation: { value: "> ## Important!\nPlease follow instructions carefully" },
      filterText: `${this.trigger}callout`
    },
    {
      label: 'Link',
      insertText: "[${1:title}](${2:url})",
      detail: 'A hyperlink',
      documentation: { value: "I love [Narrator](https://www.narratordata.com)" },
      filterText: `${this.trigger}link`
    },
    {
      label: 'Code Block',
      insertText: "```\n$0\n```",
      detail: 'Inserts a code block',
      documentation: { value: "```\nprint('hello world')\n```" },
      filterText: `${this.trigger}code`
    }, 
    {
      label: 'Comment',
      insertText: "<!--\n$0\n-->",
      detail: 'Markdown comment',
      documentation: { value: "Comments don't show up in Markdown!" },
      filterText: `${this.trigger}comment`
    },
    {
      label: 'Code Inline',
      insertText: "`$0`",
      detail: 'Code on a single line',
      documentation: { value: "We should use the `max` variable" },
      filterText: `${this.trigger}code inline`
    },
    {
      label: 'Line break',
      insertText: "<br>",
      detail: 'Break a line',
      documentation: { value: "First line\n\nSecond line" },
      filterText: `${this.trigger}line break`
    },
    {
      label: 'Divider',
      insertText: "\n***\n\n",
      detail: 'Horizontal line used to divide sections',
      documentation: { value: "First line\n\n***\n\nSecond line" },
      filterText: `${this.trigger}horizontal divider`
    },
    {
      label: 'Non-breaking Space',
      insertText: "&nbsp; ",
      detail: 'Space',
      documentation: { value: "I have a long space before &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;me." },
      filterText: `${this.trigger}non breaking space`
    },
    {
      label: 'Ordered List',
      insertText: "1. ",
      detail: 'Ordered List',
      documentation: { value: "1. Learn Markdown\n2. Profit" },
      filterText: `${this.trigger}ordered list`
    },
    {
      label: 'Unordered List',
      insertText: "- ",
      detail: 'Unordered List',
      documentation: { value: "- First\n- Second" },
      filterText: `${this.trigger}unordered list`
    },
    
  ] as ICompletionItem[]


  getCompletionResult(position: IPosition, triggerCharacter: string) : ICompletionItem[] {
    
    if (triggerCharacter === this.trigger) {

      // Make a custom range to replace the trigger character
      // Note this requires us to add the trigger to the filterText
      // Since it's now part of the range none of our snippets will
      // match unless it's also in the filter
      const replaceRange: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - this.trigger.length,
        endColumn: position.column
      }

      return this.completionItems.map(item => {
        // Monaco Editor requires a NEW object for completion items
        let result = {...item}
        result.range = replaceRange
        result.insertTextRules = 4, // insert as snippet
        result.kind = CompletionKind.snippet
        return result
      })
    }

    return [] as ICompletionItem[]
  }

  provideCompletionItems (
    content: ITextModel, 
    position: IPosition, 
    context: ICompletionContext) : ICompletionResult {

    if (!isInSqlBlock(content, position)) {
      const triggerCharacter = context.triggerCharacter
      if (triggerCharacter) {
        return { suggestions: this.getCompletionResult(position, triggerCharacter) }
      }
    }

    return { suggestions: [] }
  }
}
