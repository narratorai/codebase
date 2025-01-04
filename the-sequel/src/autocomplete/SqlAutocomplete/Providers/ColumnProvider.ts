
import { IPosition, IRange } from '../../textInterfaces'
import { ICompletionItem } from '../../autocompleteInterfaces'
import { IWarehouseProvider } from '../SqlCompletionService';
import ColumnProviderBase from './ColumnProviderBase'

//
// Simple column provider: returns columns only when preceeded by the table name
// Example usage
// select dw.activity_stream -> [column names] -> select activities
//
// Has special code to remove the 'dw.activity_stream' prefix from the column name

export default class ColumnProvider extends ColumnProviderBase implements IWarehouseProvider {

  getCompletionResult(range: IRange, previousWord: string, typingWord: string, position: IPosition) : ICompletionItem[] {
    
    // expects a full table name of the form schema.table
    const fullTableName = previousWord;

    // range to replace is current typing position all the way back to
    // the beginning of the prefix (schema.table.colu )
    const prefix = fullTableName + '.'
    return this.getCompletionFromTable(fullTableName, position, prefix, typingWord)
  }
}


