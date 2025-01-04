
import { CompletionKind, IWarehouseProvider } from '../SqlCompletionService'
import { IRange } from '../../textInterfaces';
import { ICompletionItem } from '../../autocompleteInterfaces';

export default class SchemaProvider implements IWarehouseProvider {

  // uses a function that returns a list of strings to 
  // provide the completion result. 
  // Note this class can't memoize that list, so the caller should
  getSchemas : () => string[];

  constructor(getSchemas: () => string[]) {
    this.getSchemas = getSchemas;
  }

  getCompletionResult(range: IRange, previousWord: string) : ICompletionItem[] {

    // select is there to help the column provider (select schema.table.column)
    // where is temporary until we support table alias: 'from activity_stream as a'
    if (["from", "join", "where"].includes(previousWord.toLowerCase()))
    {
      const schemas = this.getSchemas();
      return schemas.map(name => {
        return {
          label: name,
          insertText: name,
          kind: CompletionKind.schema,
          range
        }
      });
    }

    return [];
  }
}