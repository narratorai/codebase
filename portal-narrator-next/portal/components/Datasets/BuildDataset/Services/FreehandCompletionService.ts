import { IAutocomplete, ICompletionItem, ICompletionResult } from '@narratorai/the-sequel'
import monaco from 'monaco-editor'
import { IColumn } from 'util/datasets/interfaces'

import { IFreehandFunction } from './MavisFunctionsLoader'

type GetFunctions = () => IFreehandFunction[]

class FreehandCompletionService implements IAutocomplete {
  private _columnProvider: ColumnProvider
  private _functionsProvider: FunctionsProvider

  constructor(columns: IColumn[], getFunctions: GetFunctions) {
    this._columnProvider = new ColumnProvider(columns)
    this._functionsProvider = new FunctionsProvider(getFunctions)
  }

  public triggerCharacters = ['$']

  provideCompletionItems = (
    _content: monaco.editor.IModel,
    position: monaco.IPosition,
    context: monaco.languages.CompletionContext
  ): ICompletionResult => {
    return {
      suggestions: [
        ...this._columnProvider.getCompletionResult(),
        ...this._functionsProvider.getCompletionResult(position, context.triggerCharacter),
      ],
    }
  }
}

class ColumnProvider {
  private _columns: IColumn[]

  constructor(columns: IColumn[]) {
    this._columns = columns
  }

  getCompletionResult(): ICompletionItem[] {
    return this._columns.map((column) => {
      return {
        label: column.label,
        kind: 2, // select the icon Monaco uses next to the completions
        insertText: column.label,
        detail: column.type,
        range: null as any,
      }
    })
  }
}

class FunctionsProvider {
  private _getFunctions: GetFunctions

  // this is a slight hack: this value is the same as monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  // we don't want providers to have a hard dependency on Monaco, so we redefine it here
  private insertAsSnippet = 4

  constructor(getFunctions: GetFunctions) {
    this._getFunctions = getFunctions
  }

  getCompletionResult(position: monaco.IPosition, triggerCharacter: string | undefined): ICompletionItem[] {
    // If we used a $ to open up the autocomplete window, remove that $ when the user selects an option
    // This is done by sending down a range that includes the $ and adding the $ to the filterText
    // so that it's part of the autocomplete operation.
    let range: monaco.IRange
    if (triggerCharacter === '$') {
      range = {
        startColumn: position.column - triggerCharacter.length,
        endColumn: position.column,
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
      }
    }

    const functions = this._getFunctions()
    return functions.map((fnc) => {
      // For snippets insert text should be of the form
      // name(${1:first_param}, ${2:second_param})
      let insertText = fnc.name + '('
      for (let i = 0; i < fnc.input_fields.length; i++) {
        const field = fnc.input_fields[i]
        const comma = i < fnc.input_fields.length - 1 ? ', ' : ')'
        insertText += `$\{${i + 1}:${field.name}}${comma}`
      }

      const label = fnc.name

      return {
        label,
        kind: 12, // select the icon Monaco uses next to the completions
        insertText,
        insertTextRules: this.insertAsSnippet,
        detail: fnc.description,
        documentation: fnc.sql,
        filterText: range ? triggerCharacter + label : label,
        range,
      }
    })
  }
}

export default FreehandCompletionService
