import SchemaProvider from "./Providers/SchemaProvider"
import TableProvider from "./Providers/TableProvider"
import ColumnProvider from "./Providers/ColumnProvider"
import TableAliasProvider from "./Providers/TableAliasProvider"
import FunctionProvider from "./Providers/FunctionProvider"
import MarkdownProvider from "./Providers/MarkdownProvider";

import {ITextModel, IPosition, IRange } from "../textInterfaces"
import { IAutocomplete, ICompletionContext, ICompletionResult, ICompletionItem } from "../autocompleteInterfaces";
import { isInSqlBlock } from "./queryFunctions";
import { IWarehouseSource } from "./SqlAutocompleteInterfaces";
 

//
// Generic autocomplete service API and implementation
// Works well with Monaco, but has no hard dependencies on it
//

//
// Given a warehouse source (a set of fuctions to get warehouse data)
// implements the IAutocomplete interface (when called will return
// a list of completion items
// 
class SqlCompletionService implements IAutocomplete {

  private warehouseProviders: IWarehouseProvider[]
  private aliasProvider?: TableAliasProvider
  private markdownProvider: MarkdownProvider
  
  public triggerCharacters = ['.', ' ', '$', '/']

  constructor(dataSource: IWarehouseSource) {

    this.warehouseProviders = [
      new SchemaProvider(dataSource.getSchemas)
    ];
    
    dataSource.getTables? this.warehouseProviders.push(new TableProvider(dataSource.getTables)) : null;
    dataSource.getFunctions? this.warehouseProviders.push(new FunctionProvider(dataSource.getFunctions)) : null;
    
    if (dataSource.getColumns) {
      const columnProvider = new ColumnProvider(dataSource.getColumns);
      this.warehouseProviders.push(columnProvider)
      this.aliasProvider = new TableAliasProvider(dataSource.getColumns)
    }

    this.markdownProvider = new MarkdownProvider()
  }

  // note the => syntax here -- we need to bind 'this' so this function will
  // execute in the context of this class when used as a callback
  provideCompletionItems = (
    content: ITextModel, 
    position: IPosition, 
    context: ICompletionContext) : ICompletionResult => {

      const triggerCharacter = context.triggerCharacter
      const [previousWord, typingWord] = this._getAutocompleteWord(content, position);

      // default range
      const typingPosition = content.getWordUntilPosition(position);
      const defaultRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: typingPosition.startColumn,
        endColumn: position.column
      }

      let completionItems: ICompletionItem[] = []

      this.warehouseProviders.forEach(provider => {
        completionItems = completionItems.concat(
            provider.getCompletionResult(defaultRange, previousWord, typingWord, position, triggerCharacter)
          );
      });
      
      if (this.aliasProvider) {
        completionItems = completionItems.concat(this.aliasProvider.getCompletionResult(previousWord, typingWord, position, triggerCharacter, content))
      }

      return {
        suggestions: completionItems
      }
  }

  // Looks at the given position to find the previous word to use for autocomplete
  _getAutocompleteWord = (content: ITextModel, position: IPosition) : [string, string] => {
   
    const typingPosition = content.getWordUntilPosition({
      lineNumber: position.lineNumber,
      column: position.column
    });

    let previousPosition = content.getWordAtPosition({
      lineNumber: position.lineNumber,
      column: this._columnBefore(typingPosition.startColumn)
    })

    let typingWord = '';
    let previousWord = '';

    if (previousPosition) {

      typingWord = typingPosition.word
      previousWord = previousPosition.word

    
      // For sql languages '.' will split words. So 'schema.table' will give us 'table'
      // For autocomplete column support we want that full table name if it exists
      // So we'll look for a '.' and bring it in.
      const dotColumn = this._columnBefore(previousPosition.startColumn);
      const dot = content.getValueInRange({
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: dotColumn,
        endColumn: dotColumn + 1
      });

      if (dot && dot == '.'){
        const wordBeforeDot = content.getWordAtPosition({
          lineNumber: position.lineNumber,
          column: this._columnBefore(dotColumn)
        });

        if (wordBeforeDot) {
          previousWord = wordBeforeDot.word + '.' + previousWord;
        }
      }
    }

    return [previousWord, typingWord];
  }

  _columnBefore = (column: number) : number => {
    return column > 1 ? column - 1 : 1;
  }
}

//
// Interfaces Internal to the library, but external to this file
// These are effectively copies of Monaco's interfaces
//


export interface IWarehouseProvider {
  getCompletionResult(range: IRange, previousWord: string, typingWord?: string, position?: IPosition, triggerCharacter?: string): ICompletionItem[]
}

export interface IContextProvider {
  getCompletionResult(previousWord: string, typingWord: string, position: IPosition, triggerCharacter: string, content: ITextModel): ICompletionItem[]
}


// these specific numbers map to icons in Monaco
export enum CompletionKind {
  schema = 13,
  table = 3,
  column = 2,
  keyword = 1,
  snippet = 12,
}

export default SqlCompletionService;

