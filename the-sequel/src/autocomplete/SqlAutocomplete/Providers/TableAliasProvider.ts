import { IContextProvider, CompletionKind } from '../SqlCompletionService'
import { Range, ITextModel, IPosition, IRange } from '../../textInterfaces'
import { ICompletionItem } from '../../autocompleteInterfaces';

import currentQueryRange from '../queryFunctions';
import ColumnProviderBase from './ColumnProviderBase';



// Given an aliased table name returns its columns
// i.e. from dw.activity_stream as a  <-- a is an alias

export default class TableAliasProvider extends ColumnProviderBase implements IContextProvider {


  getCompletionResult(previousWord: string, typingWord: string, position: IPosition, triggerCharacter: string | undefined, content: ITextModel) : ICompletionItem[] {

    if (triggerCharacter != '.') {
      return []
    }

    // A note on performance
    // This function is called every time the user types a '.' and runs a 
    // regex each time. In practice this hasn't been too slow
    // A more performant solution might be to precompute this match, but then this provider
    // wouldn't be stateless, and ensuring it's correct and in sync with the editor would
    // be very hard and bug-prone. So it's strongly not advised.

    //
    // First build a mapping of alias -> table name for the current query under the cursor
    //


    // match [from or join] (table_name) [as or ] (table_alias)
    // note that (table_name) is the full table name with any number of levels (schema.table or database.schema.table)
    
    // BigQuery: a project name can contain dashes. Datasets and tables cannot, but they can have underscores
    // my-project.my_dataset.my_table

    // note the single \\n -- unless it appears at least once in the regex Monaco won't match multiline strings
    const aliasExpressions = content.findMatches('(?:from|join)[\\n\\s]+([\\w\\.\\-`]+)[\\s]*(?:as)?[\\s]+([\\w]+)', true, true, false, null, true);

    if (aliasExpressions.length > 0) {
      let aliasMapping : Record<string, string> = {}
      const queryRange = currentQueryRange(content, position) as Range

      aliasExpressions.forEach(foundMatch => {
        const matches = foundMatch.matches
        
        // only use alias found in the current query
        if(queryRange.containsRange(foundMatch.range) && matches?.length == 3) {
          // first match is the entire expression; next two are the table name and alias
          const tableName = matches[1]
          const alias = matches[2]
          aliasMapping[alias] = tableName
        }
      })

      //
      // if the previous word is an identified alias then send the 'real' table name to the column provider
      // 
      const table = aliasMapping[previousWord]
      if (table) {
        const prefix = previousWord + '.'
        return this.getCompletionFromTable(table, position, prefix, typingWord)
      }
    }

    return []
  }

  // override base class implementation to add the special 'all columns' item
  buildCompletionItems(
    { columns, prefix, range }: 
    { columns: string[], prefix: string, range: IRange}) {
    
      // send a null range -- we don't want to replace
      let items = columns.map(name => this.buildColumnItem({name, prefix, range}));
      items.length > 0 && items.unshift(this._buildAllColumnsItem(columns, prefix, range));

      return items
  }

   // override the default implementation
   buildColumnItem (
    { name, prefix, range }: {name: string, prefix: string, range: IRange} ) : ICompletionItem {
  
      // ignore the given range and prefix: we don't want to go backwards and replace
      // the prefix text (in this case the table alias). 
      // i.e. a. -> a.mycolumn
      return {
        label: name,
        insertText: name,
        kind: CompletionKind.column,

        // TODO: monaco doesn't allow null for range, but if you pass it in it does the right thing
        // (provides a default range). The given range in this function isn't the default.
        // It's hard to compute the default from here so for now we'll just exploit Monaco
        range: null as any,  
      } as ICompletionItem
    }

  private _buildAllColumnsItem(columns: string[], prefix: string, range: IRange): ICompletionItem {

    let label = 'all_columns';
    const fullName = prefix + label;

    let text = `
  ${columns.map(name => `${prefix}${name}`).join('\n  , ')}
`;

    return {
      label,
      insertText: text,
      kind: CompletionKind.snippet,
      detail: "all columns",
      documentation: text,
      filterText: fullName,
      range: range
    }
  }
}
