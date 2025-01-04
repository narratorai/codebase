import { ITextModel, IPosition, IRange } from "./textInterfaces";

//
// Interfaces to support autocomplete, also mimicing Monaco's
//

// Primary interface that we pass to Monaco. Our completion service implements this
export interface IAutocomplete {
  provideCompletionItems(
    content: ITextModel, 
    position: IPosition, 
    context: ICompletionContext) : ProviderResult<ICompletionResult>
  triggerCharacters?: string[]
}

type markdownValue = {
  value: string
}

export type ProviderResult<T> = T | undefined | null | PromiseLike<T | undefined | null>

export interface ICompletionItem {
  label: string
  insertText: string
  kind: number
  range: IRange
  detail?: string
  documentation?: string | markdownValue   // To show text just pass in a string. To show markdown pass in { value: "# my markdown string"}
  sortText?: string
  filterText?: string
  insertTextRules?: number                 // 4 means insertAsSnippet
}

export interface ICompletionContext {
  triggerCharacter?: string
}

export interface ICompletionResult {
  suggestions: ICompletionItem[]
}