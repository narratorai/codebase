import { ICompletionItem } from '@narratorai/the-sequel'
import { ICompletionContext } from '@narratorai/the-sequel/dist/autocomplete/autocompleteInterfaces'
import { IPosition, IRange, ITextModel } from '@narratorai/the-sequel/dist/autocomplete/textInterfaces'
import FieldsCompletionService, { FunctionDefinition } from './FieldsCompletionService'

/* eslint-disable  @typescript-eslint/no-unused-vars */

const noopGetGroups = async (datasetSlug: string) => {
  return []
}
interface IWordAtPosition {
  startColumn: number
  endColumn: number
  word: string
}

class MockTextModel implements ITextModel {
  private content: string
  public position: IPosition
  public completionContext: ICompletionContext

  constructor(content: string) {
    this.content = content
    this.position = this.lastPosition()
    this.completionContext = this.getcompletionContext()
  }

  //
  // Test helpers
  //

  lastPosition(): IPosition {
    const lines = this.lines()
    return {
      lineNumber: lines.length, // lineNumber starts at 1
      column: this.lastLine().length, // column starts at 1
    }
  }

  lines(): string[] {
    return this.content.split('\n')
  }

  lastLine(): string {
    const lines = this.lines()
    return lines[lines.length - 1]
  }

  isLastPosition(position: IPosition): boolean {
    const last = this.lastPosition()
    return position.lineNumber === last.lineNumber && position.column === last.column
  }

  getcompletionContext(): ICompletionContext {
    const triggerCharacter = this.content.endsWith('.') ? '.' : undefined
    return { triggerCharacter }
  }

  //
  // ITextModel mock implementation
  //

  getValue = () => {
    return this.content
  }

  getWordUntilPosition(position: IPosition): IWordAtPosition {
    // Not a real implementation: assumes the position is the last line
    // and the last line only has one word on it
    if (!this.isLastPosition(position)) {
      throw new Error('getWordUntilPosition not implemented.')
    }

    return {
      word: this.lastLine(),
      startColumn: 0,
      endColumn: this.lastLine().length,
    }
  }

  getOffsetAt(position: IPosition): number {
    if (!this.isLastPosition(position)) {
      throw new Error('getOffsetAt not implemented.')
    }
    return this.content.length
  }

  findMatches(
    searchString: string,
    searchOnlyEditableRange: boolean,
    isRegex: boolean,
    matchCase: boolean,
    wordSeparators: string | null,
    captureMatches: boolean
  ): {
    matches: string[] | null
    range: IRange
  }[] {
    throw new Error('Method not implemented.')
  }
  findNextMatch(
    searchString: string,
    searchStart: IPosition,
    isRegex: boolean,
    matchCase: boolean,
    wordSeparators: string | null,
    captureMatches: boolean
  ): {
    matches: string[] | null
    range: IRange
  } | null {
    throw new Error('Method not implemented.')
  }
  getFullModelRange(): IRange {
    throw new Error('Method not implemented.')
  }
  getLineLastNonWhitespaceColumn(lineNumber: number): number {
    throw new Error('Method not implemented.')
  }
  getLineFirstNonWhitespaceColumn(lineNumber: number): number {
    throw new Error('Method not implemented.')
  }
  getPositionAt(offset: number): IPosition {
    throw new Error('Method not implemented.')
  }
  getValueInRange(range: IRange): string {
    throw new Error('Method not implemented.')
  }
  getValueLength(): number {
    throw new Error('Method not implemented.')
  }
  getWordAtPosition(position: IPosition): IWordAtPosition | null {
    throw new Error('Method not implemented.')
  }

  validateRange(range: IRange): IRange {
    throw new Error('Method not implemented.')
  }
  getModeId(): string {
    throw new Error('Method not implemented.')
  }
}

const datasetDefinitions = [
  {
    name: 'MRR Over Time',
    slug: 'mrr_over_timee23d180a',
  },
  {
    name: 'Blog Metrics',
    slug: 'blog_metrics84931bbf',
  },
]

const defaultCompletionContext = {
  triggerCharacter: undefined,
}

const mrr_groups = [
  { slug: 'month5c97090d', name: 'by Month', columns: [{ id: 'month_12488f2d', label: 'Month' }] },
  { slug: 'customerfc1e8656', name: 'by Customer', columns: [{ id: 'customer_fdd9ad4c', label: 'Customer' }] },
]

const mrrCompletions = [
  {
    label: 'by Month',
    insertText: 'month5c97090d',
    detail: 'Group - month5c97090d',
    kind: 3,
  },
  {
    label: 'by Customer',
    insertText: 'customerfc1e8656',
    detail: 'Group - customerfc1e8656',
    kind: 3,
  },
]

const getGroups = async (datasetSlug: string): Promise<any> => {
  if (datasetSlug === 'mrr_over_timee23d180a') {
    return mrr_groups
  }
}

// strips range off items to make comparison easier
const withoutRange = (item: ICompletionItem | ICompletionItem[]): object | object[] => {
  if (item instanceof Array) {
    return item.map((entry) => {
      return withoutRange(entry)
    })
  }

  const { range, ...newItem } = item
  return newItem
}

describe('list of datasets', () => {
  const datasetsLiteralCompletion = {
    label: 'Datasets',
    insertText: 'datasets',
    detail: 'List of available datasets',
    kind: 13,
  }

  const service = new FieldsCompletionService(datasetDefinitions, [], noopGetGroups)

  it('matches the string "datasets"', () => {
    const service = new FieldsCompletionService([], [], noopGetGroups)
    const code = new MockTextModel('x = dat')

    const promise = service.provideCompletionItems(code, code.position, defaultCompletionContext)
    return promise.then((completionItems) => {
      expect(withoutRange(completionItems.suggestions[0])).toEqual(datasetsLiteralCompletion)
    })
  })

  it('only matches datasets when written alone', () => {
    const code = new MockTextModel('x.dat')
    const expected: ICompletionItem[] = []

    const promise = service.provideCompletionItems(code, code.position, defaultCompletionContext)
    return promise.then((completionItems) => {
      expect(completionItems.suggestions).toEqual(expected)
    })
  })

  it('returns a list of datasets', () => {
    const code = new MockTextModel('datasets.')
    const expected = [
      {
        label: 'MRR Over Time',
        insertText: 'mrr_over_timee23d180a',
        detail: undefined,
        documentation: undefined,
        range: {
          startLineNumber: 1,
          endLineNumber: 1,
          startColumn: 0,
          endColumn: 9,
        },
        kind: 13,
      },
      {
        label: 'Blog Metrics',
        insertText: 'blog_metrics84931bbf',
        detail: undefined,
        documentation: undefined,
        range: {
          startLineNumber: 1,
          endLineNumber: 1,
          startColumn: 0,
          endColumn: 9,
        },
        kind: 13,
      },
    ]

    const promise = service.provideCompletionItems(code, code.position, code.completionContext)
    return promise.then((completionItems) => {
      expect(completionItems.suggestions).toEqual(expected)
    })
  })

  it('does not return datasets list without the dot', () => {
    const code = new MockTextModel('datasets')
    const promise = service.provideCompletionItems(code, code.position, defaultCompletionContext)
    return promise.then((completionItems) => {
      expect(withoutRange(completionItems.suggestions[0])).toEqual(datasetsLiteralCompletion)
    })
  })
})

describe('list of groups autocomplete', () => {
  it('completes datasets.dataset.group', () => {
    const code = new MockTextModel('datasets.mrr_over_timee23d180a.')
    const service = new FieldsCompletionService(datasetDefinitions, [], getGroups)
    const promise = service.provideCompletionItems(code, code.position, code.completionContext)

    return promise.then((completionItems) => {
      expect(withoutRange(completionItems.suggestions)).toEqual(mrrCompletions)
    })
  })

  it('completes a variable group', () => {
    const code = new MockTextModel('x = datasets.mrr_over_timee23d180a\nx.')
    const service = new FieldsCompletionService(datasetDefinitions, [], getGroups)
    const promise = service.provideCompletionItems(code, code.position, code.completionContext)

    return promise.then((completionItems) => {
      expect(withoutRange(completionItems.suggestions)).toEqual(mrrCompletions)
    })
  })
})

describe('list of functions autocomplete', () => {
  const functionDefinitions = [
    {
      label: 'filter',
      insertText: "filter('${1:column}', '${2:condition}', '${3:value}')",
      description: 'Filters a group by comparing a column with a condition',
      calledOn: 'group',
      returns: 'group',
    },
    {
      label: 'sum',
      insertText: "sum('${1:column}')",
      description: 'Returns the sum of all values for the given column',
      calledOn: 'group',
      returns: 'value',
    },
  ] as FunctionDefinition[]

  const functionCompletions = [
    {
      label: 'filter',
      insertText: "filter('${1:column}', '${2:condition}', '${3:value}')",
      detail: 'Filters a group by comparing a column with a condition',
      documentation: undefined,
      kind: 12,
      insertTextRules: 4,
    },
    {
      label: 'sum',
      insertText: "sum('${1:column}')",
      detail: 'Returns the sum of all values for the given column',
      documentation: undefined,
      kind: 12,
      insertTextRules: 4,
    },
  ]

  it('completes group functions', () => {
    const code = new MockTextModel('datasets.mrr_over_timee23d180a.month5c97090d.')
    const service = new FieldsCompletionService(datasetDefinitions, functionDefinitions, getGroups)
    const promise = service.provideCompletionItems(code, code.position, code.completionContext)

    return promise.then((completionItems) => {
      expect(withoutRange(completionItems.suggestions)).toEqual(functionCompletions)
    })
  })

  it('completes a chained function group', () => {
    const code = new MockTextModel('datasets.mrr_over_timee23d180a.month5c97090d.filter("column", ">=", "3").')
    const service = new FieldsCompletionService(datasetDefinitions, functionDefinitions, getGroups)
    const promise = service.provideCompletionItems(code, code.position, code.completionContext)

    return promise.then((completionItems) => {
      expect(withoutRange(completionItems.suggestions)).toEqual(functionCompletions)
    })
  })
})

describe('defined variables completion', () => {
  const service = new FieldsCompletionService([], [], noopGetGroups)

  it('matches an object assignment', () => {
    const code = new MockTextModel('variable = datasets.testing\nvar')
    const expected = [
      {
        label: 'variable',
        insertText: 'variable',
        detail: 'datasets.testing',
        range: {
          startLineNumber: 2,
          endLineNumber: 2,
          startColumn: 0,
          endColumn: 3,
        },
        kind: 1,
      },
    ]

    const promise = service.provideCompletionItems(code, code.position, defaultCompletionContext)
    return promise.then((completionItems) => {
      expect(completionItems.suggestions).toEqual(expected)
    })
  })
})
