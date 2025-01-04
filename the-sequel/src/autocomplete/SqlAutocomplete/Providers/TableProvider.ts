import { CompletionKind, IWarehouseProvider } from '../SqlCompletionService'
import { IRange } from '../../textInterfaces';
import { ICompletionItem } from '../../autocompleteInterfaces';


export default class TableProvider implements IWarehouseProvider {

  // uses a function that returns a list of strings to 
  // provide the completion result. 
  // Note this class can't memoize that list, so the caller should
  getTables : (schema: string) => string[];

  constructor(getTables: (schema: string) => string[]) {
    this.getTables = getTables;
  }

  getCompletionResult(range: IRange, previousWord: string) : ICompletionItem[] {
    const schema = previousWord;
    const tables = this.getTables(schema);
    return tables.map(name => {
      return {
        label: name,
        insertText: name,
        kind: CompletionKind.table,
        range
      }
    });
    return [];
  }
}