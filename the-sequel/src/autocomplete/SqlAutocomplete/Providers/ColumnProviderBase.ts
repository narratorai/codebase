import { CompletionKind } from '../SqlCompletionService'
import { IRange, IPosition } from '../../textInterfaces'
import { ICompletionItem } from '../../autocompleteInterfaces'

//
// Base class with common code for providing columns to autocompletion results
// 


export default class ColumnProviderBase {

  // uses a function that returns a list of strings to 
  // provide the completion result. 
  // Note this class can't memoize that list, so the caller should
  getColumns : (schema: string, table: string) => string[];

  constructor(getColumns: (schema: string, table: string) => string[]) {
    this.getColumns = getColumns;
  }

  
  protected getCompletionFromTable(fullTableName: string, position: IPosition, prefix: string, typingWord: string) {
    
    // a full table name is of the form schema.table 
    // where schema is either a simple string (narrator)
    // or in the form database.schema (db.narrator)
    // so for db.narrator.activity_stream
    // schema: db.narrator
    // table: activity_stream
    //
    // BigQuery can be of the form `project-name`.dataset.table so we strip out the backticks
    var components = fullTableName.replace(/`/g, ``).split('.');

    if (components.length > 1) {
      const table = components[components.length - 1]
      const schema = components.slice(0, components.length - 1).join(".")
      const columns = this.getColumns(schema, table);

      if (columns) {

        // Build a custom range for replacing what was typed before
        // this consists of a prefix (maybe dw.activity_stream or a.)
        // and the partially-matched word that was typed
        const replaceRange: IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - (prefix.length + typingWord.length),
          endColumn: position.column
        }

        let items = this.buildCompletionItems({columns, prefix, range: replaceRange})
        
         // sort items by their position in the list, not their label
         for (let i = 0; i < items.length; i++) {
          items[i].sortText = i.toString().padStart(4, "0")
        }

        return items
      }
    }
    return []
  }

  // default implementation
  protected buildCompletionItems(
    { columns, prefix, range }: 
    { columns: string[], prefix: string, range: IRange}) {
    return columns.map(name => this.buildColumnItem({name, prefix, range}));
  }

  // default implementation
  protected buildColumnItem (
    { name, range, prefix }: { name: string, range: IRange, prefix: string } ) : ICompletionItem {

    // fullName and range here are a bit special.
    // Autocomplete in Monaco will only replace text that's
    // part of the autocomplete filter. 
    //
    // By giving the full entire prefix + name as the 
    // filterText we're telling autocomplete that it can 
    // replace evertyhing from the prefix to the fully-typed name
    // By default it does not allow replacement backwards before the
    // character that kicked off autocomplete -- setting filterText
    // is required to allow it.
    // 
    // For this to work we also have to specify out the range we're
    // going to replace -- starting from the beginning of the prefix
    // to the current cursor position
    const fullName = prefix + name;
    const item: ICompletionItem = {
      label: name,
      insertText: name,
      filterText: fullName,
      kind: CompletionKind.column,
      range
    }

    return item
  }
}