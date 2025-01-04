
//
// Interfaces that mimic the ones used by Monaco
//

export interface IPosition {
  readonly lineNumber: number;
  readonly column: number;
}

export interface IRange {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

export interface Range extends IRange {
  containsRange(range: IRange): boolean
}

type FindMatch = { matches: string[] | null, range: IRange }

export interface ITextModel {
  findMatches(searchString: string, searchOnlyEditableRange: boolean, isRegex: boolean, matchCase: boolean, wordSeparators: string | null, captureMatches: boolean) : FindMatch[]
  findNextMatch(searchString: string, searchStart: IPosition, isRegex: boolean, matchCase: boolean, wordSeparators: string | null, captureMatches: boolean): FindMatch | null
  getFullModelRange() : IRange
  getLineLastNonWhitespaceColumn(lineNumber: number) : number
  getLineFirstNonWhitespaceColumn(lineNumber: number) : number
  getOffsetAt(position: IPosition): number
  getPositionAt(offset: number): IPosition
  getValue(): string
  getValueInRange(range: IRange ) : string
  getValueLength(): number
  getWordAtPosition(position: IPosition) : IWordAtPosition | null
  getWordUntilPosition(position: IPosition) : IWordAtPosition
  validateRange(range: IRange): IRange
  getModeId(): string
}

interface IWordAtPosition {
  word: string,
  startColumn: number,
  endColumn: number
}