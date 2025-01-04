import { IAutocomplete, ICompletionResult, ICompletionItem } from '@narratorai/the-sequel'
import { ICompletionContext } from '@narratorai/the-sequel/dist/autocomplete/autocompleteInterfaces'
import { IPosition, IRange, ITextModel } from '@narratorai/the-sequel/dist/autocomplete/textInterfaces'

//
// Implements Monaco-style autocomplete for Fields written in a subset of Python
//
class FieldsCompletionService implements IAutocomplete {
  private datasetDefinitions: DatasetDefinition[]
  private functionDefinitions: FunctionDefinition[]
  private typeCompletions: TypeCompletions

  // async group loading
  private getGroups: GetGroups
  private loading = false
  private slugToGetGroups: string | null = null

  public triggerCharacters = ['.']

  constructor(datasets: DatasetDefinition[], functionDefinitions: FunctionDefinition[], getGroups: GetGroups) {
    this.datasetDefinitions = datasets
    this.functionDefinitions = functionDefinitions
    this.typeCompletions = this._buildTypeCompletions(functionDefinitions)
    this.getGroups = getGroups
  }

  _previousToken(previousWord: string): string {
    const tokens = previousWord.split('.')
    return tokens[tokens.length - 1]
  }

  public async provideCompletionItems(
    content: ITextModel,
    position: IPosition,
    context: ICompletionContext
  ): Promise<ICompletionResult> {
    this.loading = false
    const triggerCharacter = context.triggerCharacter

    // default range
    const typingPosition = content.getWordUntilPosition(position)
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: typingPosition.startColumn,
      endColumn: position.column,
    }

    let completionItems: ICompletionItem[] = []

    const previousChain = this._prevChainedIdentifier(content, position)
    const symbolMap = this._mapSymbols(content.getValue())

    completionItems = completionItems.concat(
      this._datasetCompletions(previousChain, range, triggerCharacter),
      this._symbolCompletions({ range, triggerCharacter, symbolMap }),
      this._completions({ previousChain, range, triggerCharacter, symbolMap })
    )

    // If nothing returned and we have something to load async, do it, and return a promise
    if (completionItems.length === 0 && this.slugToGetGroups) {
      await this._loadGroups(this.slugToGetGroups)
      this.slugToGetGroups = null

      return new Promise((resolve) => {
        resolve({
          suggestions: completionItems.concat(
            this._datasetCompletions(previousChain, range, triggerCharacter),
            this._symbolCompletions({ range, triggerCharacter, symbolMap }),
            this._completions({ previousChain, range, triggerCharacter, symbolMap })
          ),
        })
      })
    }

    return {
      suggestions: completionItems,
    }
  }

  // returns list of datasets available
  _datasetCompletions = (
    previousWord: string,
    range: IRange,
    triggerCharacter: string | undefined
  ): ICompletionItem[] => {
    if (triggerCharacter === '.' && previousWord === 'datasets') {
      return this.datasetDefinitions.map((dataset) => {
        return {
          label: dataset.name,
          insertText: dataset.slug,
          detail: dataset.description,
          documentation: dataset.documentation,
          range,
          kind: CompletionKind.dataset,
        }
      })
    } else if (triggerCharacter === undefined && 'datasets'.startsWith(previousWord)) {
      // only trigger datasets list if we're typing a new word (i.e. not something.datasets)
      return [
        {
          label: 'Datasets',
          insertText: 'datasets',
          detail: 'List of available datasets',
          range,
          kind: CompletionKind.dataset,
        },
      ]
    }
    return []
  }

  // returns autocomplete for everything that's not a list of datasets
  _completions = ({
    previousChain,
    range,
    triggerCharacter,
    symbolMap,
  }: {
    previousChain: string
    range: IRange
    triggerCharacter: string | undefined
    symbolMap: SymbolMap
  }): ICompletionItem[] => {
    let completions = [] as ICompletionItem[]

    if (triggerCharacter !== '.') {
      return completions
    }

    let previousType: KnownTypes = KnownTypes.invalid
    let groupDefinitions
    let columnDefinitions
    const names = previousChain.split('.')

    // First replace variables - called symbols here -- with what they alias to
    // x -> datasets.mrr
    let symbol
    do {
      symbol = symbolMap[names[0]]
      if (symbol) {
        // replace the variable names array with what the variable is aliasing
        // it's possible to replace 'y' with 'x.mrr', so we loop until out of known symbols
        names.shift()
        names.unshift(...symbol.aliasOf.split('.'))
      }
    } while (symbol)

    // Loop through the identifiers in the current chain and look up each one.
    // The goal is to end the loop by knowing the last identifier (the one we're autocompleting)
    for (let i = 0; i < names.length; i++) {
      const identifier = names[i]

      // dataset (datasets.mrr)
      if (i === 1 && names[0] === 'datasets') {
        const dataset = this._getDatasetDefinition(identifier)

        if (!dataset) {
          previousType = KnownTypes.invalid
          break
        }

        groupDefinitions = dataset.groups

        if (!groupDefinitions) {
          // Groups are loaded async from the backend.
          // Here it was not found, so make a note of the groups to be loaded async
          // when this call returns
          this.slugToGetGroups = dataset.slug
        }

        previousType = KnownTypes.dataset
        continue
      }

      // group (datasets.mrr.by_month)
      if (previousType === KnownTypes.dataset) {
        const group = groupDefinitions?.find((groupDef: GroupDefinition) => groupDef.slug === identifier)
        if (!group) {
          previousType = KnownTypes.invalid
          break
        }

        columnDefinitions = group.columns
        previousType = KnownTypes.group
        continue
      }

      // column
      const column = columnDefinitions?.find((column: ColumnDefinition) => column.id === identifier)
      if (column) {
        // currently we only support a column name when used to go into a row
        previousType = KnownTypes.value
        continue
      }

      // function
      const funcDef = this.functionDefinitions.find((func) => func.label === identifier)
      if (funcDef && funcDef.calledOn === previousType) {
        // TODO: we have minor issue if a group or column name is the same as a function name.
        //       To disambiguate we could mark functions when building out the previousChain.
        //       Have it be an array of objects instead of a string. Not worth it yet.
        previousType = funcDef.returns
        continue
      }

      // we don't know what it is so it's invalid
      previousType = KnownTypes.invalid
    }

    // Build completion items for the last identifier based on its instance
    if (previousType === KnownTypes.dataset && groupDefinitions) {
      // If the last type is a dataset then we want to autocomplete a list of groups
      // which we should have found in the loop above
      completions = completions.concat(
        groupDefinitions.map((group: GroupDefinition) => {
          return {
            label: group.name,
            insertText: group.slug,
            detail: `Group - ${group.slug}`,
            range,
            kind: CompletionKind.group,
          }
        })
      )
    }

    if (previousType === KnownTypes.row && columnDefinitions) {
      completions = completions.concat(
        columnDefinitions.map((column: ColumnDefinition) => {
          return {
            label: column.label,
            insertText: column.id,
            detail: `Column - ${column.label}`,
            range,
            kind: CompletionKind.column,
          }
        })
      )
    }

    // Add any completion items that apply to the type, not the instance
    const typeCompletions = this.typeCompletions[previousType]
    if (typeCompletions) {
      completions = completions.concat(
        typeCompletions.map((entry) => {
          // Very important: the object we return to completions MUST be a copy.
          // We CANNOT reuse completion items since they only work for their specific range
          return { range, ...entry }
        })
      )
    }

    return completions
  }
  _symbolCompletions = ({
    range,
    triggerCharacter,
    symbolMap,
  }: {
    range: IRange
    triggerCharacter: string | undefined
    symbolMap: SymbolMap
  }): ICompletionItem[] => {
    // Autocompletes variables defined in the text editor
    // i.e. x = round(5.2) will autocomplete 'x' with detail: 'round(5.2)'
    //
    // FUTURE: after executing the code it would
    // be nice to replace the detail with the actual computed
    // value of the variable

    let completions = [] as ICompletionItem[]

    if (triggerCharacter !== '.') {
      completions = Object.entries(symbolMap).map((entry) => {
        const [key, value] = entry
        return {
          label: key,
          insertText: key,
          detail: value.aliasOf,
          range,
          kind: CompletionKind.value,
        }
      })
    }

    return completions
  }

  _mapSymbols = (content: string): SymbolMap => {
    // Here we're making a guess without actually executing code
    // x = datasets.mrr
    // we want to 'know' what x is, so we're mapping variable assignment
    // to what we think it originally was

    const matches = [...content.matchAll(ASSIGNMENT_REGEX)]
    const symbols: SymbolMap = {}

    matches.forEach((match) => {
      symbols[match[1]] = {
        aliasOf: match[2],
      }
    })

    return symbols
  }

  _buildTypeCompletions = (functionDefinitions: FunctionDefinition[]): TypeCompletions => {
    const completions: TypeCompletions = {}

    functionDefinitions.forEach((def) => {
      const typeList = completions[def.calledOn]
      if (!typeList) {
        completions[def.calledOn] = []
      }

      completions[def.calledOn].push({
        label: def.label,
        insertText: def.insertText,
        detail: def.description,
        documentation: def.documentation,
        kind: CompletionKind.function,
        insertTextRules: insertAsSnippet,
      })
    })

    return completions
  }

  _prevChainedIdentifier = (content: ITextModel, position: IPosition): string => {
    // finds the chained identifier just before the cursor position
    // A chained identifier is: mrr.by_month.filter
    // basically a sequence of attribute or function calls

    const currentOffset = content.getOffsetAt(position)
    const parsedContent = this._replaceParens(content.getValue())
    const chainedIdentifiers = [...parsedContent.matchAll(CHAINED_REGEX)]

    let prevMatch
    for (let i = 0; i < chainedIdentifiers.length; i++) {
      const match = chainedIdentifiers[i]
      if (match.index && match.index > currentOffset) {
        break
      }
      prevMatch = match
    }

    let prevIdentifier = prevMatch ? prevMatch[0] : ''

    // replace last trailing .
    if (prevIdentifier.endsWith('.')) {
      prevIdentifier = prevIdentifier.slice(0, prevIdentifier.length - 1)
    }

    return prevIdentifier.replace(/\*/g, '') // now that we've identified the position we can remove the placeholder chars
  }

  _replaceParens = (content: string): string => {
    // replace parentheses, and anything between them, from a string
    // filter(sum(34), 5) -> filter************
    // preserves the original string length

    // TODO: we should only replace parens as part of a function call func()
    // instead of an expression (x + y)

    let result = ''
    let firstParen = 0
    let lastParen = 0
    let parenDepth = 0
    for (let i = 0; i < content.length; i++) {
      const char = content[i]

      switch (char) {
        case '(':
          parenDepth += 1
          if (parenDepth === 1) {
            firstParen = i
            result += content.slice(lastParen === 0 ? 0 : lastParen + 1, i)
          }
          break
        case ')':
          parenDepth -= 1
          if (parenDepth === 0) {
            lastParen = i
            result += '*'.repeat(lastParen - firstParen + 1) // add in filler to preserve string length
          }
          break
      }
    }

    result += content.slice(lastParen === 0 ? 0 : lastParen + 1)
    return result
  }

  _loadGroups = async (slug: string): Promise<void> => {
    if (!this.loading) {
      this.loading = true
      const groups = await this.getGroups(slug)
      this.loading = false

      // We found groups for the dataset -- store them
      if (groups) {
        const dataset = this._getDatasetDefinition(slug)
        if (dataset && !dataset.groups) {
          dataset['groups'] = groups
        }
      }
    }
  }

  _getDatasetDefinition(slug: string): DatasetDefinition | undefined {
    return this.datasetDefinitions.find((dataset) => dataset.slug === slug)
  }
}

enum KnownTypes {
  dataset = 'dataset',
  group = 'group',
  column = 'column',
  row = 'row',
  value = 'value',
  global = 'global',
  invalid = 'invalid',
}

// this is a slight hack: this value is the same as monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
// we don't want providers to have a hard dependency on Monaco, so we redefine it here
const insertAsSnippet = 4

// these specific numbers map to icons in Monaco
enum CompletionKind {
  dataset = 13,
  group = 3,
  column = 2,
  value = 1,
  function = 12,
}

/* eslint-disable no-useless-escape */
const CHAINED_REGEX = /[\w\.\*]+/g // x.y.z

// x = datasets.abcd or y = human_format('abc') or z = {"hi": something}
// NOTE: parsing is not perfect: allows spaces anywhere, when it should only be between () or {}
const ASSIGNMENT_REGEX = /([\w\.\*]+) *= *([\w\.\*()="', {:}]+)/g

interface IMarkdownString {
  value: string
}

type DatasetDefinition = {
  name: string
  slug: string
  description?: string
  documentation?: IMarkdownString
  groups?: GroupDefinition[]
}

type ColumnDefinition = {
  id: string
  label: string
}

type GroupDefinition = {
  name: string
  slug: string
  columns: ColumnDefinition[]
}

export type FunctionDefinition = {
  label: string
  insertText: string
  description?: string
  documentation?: { value: string }
  calledOn: KnownTypes
  returns: KnownTypes
}

type TypeCompletions = {
  [key: string]: Omit<ICompletionItem, 'range'>[]
}

type GetGroups = (datasetSlug: string) => Promise<GroupDefinition[]>
type SymbolMap = { [key: string]: { aliasOf: string } }

export default FieldsCompletionService
