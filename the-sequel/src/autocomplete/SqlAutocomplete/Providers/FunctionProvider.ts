
import { IFunctionSnippet } from '../SqlAutocompleteInterfaces'
import { IPosition, IRange } from '../../textInterfaces';
import { ICompletionItem } from '../../autocompleteInterfaces';
import { CompletionKind, IWarehouseProvider } from '../SqlCompletionService';


//
// Inserts SQL function snippets
//

export default class FunctionProvider implements IWarehouseProvider {

  private trigger = "$"

  // this is a slight hack: this value is the same as monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  // we don't want providers to have a hard dependency on Monaco, so we redefine it here
  private insertAsSnippet = 4  

  // uses a function that returns a list of strings to 
  // provide the completion result. 
  // Note this class can't memoize that list, so the caller should
  getFunctions : () => IFunctionSnippet[];

  constructor(getFunctions: () => IFunctionSnippet[]) {
    this.getFunctions = getFunctions;
  }

  getCompletionResult(range: IRange, previousWord: string, typingWord: string, position: IPosition, triggerCharacter: string) : ICompletionItem[] {

    if(triggerCharacter == this.trigger)
    {
      const functions = this.getFunctions();

      if (functions) {

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

        return functions.map(snippet => {
          return {
            label: snippet.name,
            insertText: snippet.sql,
            insertTextRules: this.insertAsSnippet,
            detail: snippet.description,
            filterText: `${this.trigger}${snippet.name}`,
            documentation: snippet.documentation,
            kind: CompletionKind.snippet,
            range: replaceRange
          }
        });
      }
    }
    return [];
  }
}