// Used to combine multiple completion services into one

import { IPosition, ITextModel } from "./textInterfaces";
import { IAutocomplete, ICompletionContext, ICompletionItem, ICompletionResult, ProviderResult } from "./autocompleteInterfaces";

export default class MultiCompletionService implements IAutocomplete {
  private _services: IAutocomplete[]
  public triggerCharacters: string[] | undefined

  constructor(services: IAutocomplete[]) {
    this._services = services
    this.triggerCharacters = services.map(s => s.triggerCharacters || []).reduce((prev, current) => prev.concat(current)) 
  }

  provideCompletionItems(
    content: ITextModel, 
    position: IPosition, 
    context: ICompletionContext) : ProviderResult<ICompletionResult> {

      return Promise.all(this._services.map(service => service.provideCompletionItems(content, position, context))).then(completionItems => {
        let combinedCompletions = {
          suggestions: [] as ICompletionItem[]
        }

        completionItems.forEach(result => {
          if (result) {
            combinedCompletions.suggestions = combinedCompletions.suggestions.concat(result.suggestions)
          }
        })
        return combinedCompletions
      })
    }
}