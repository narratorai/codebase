import { ICompany } from 'graph/generated'
import { GetToken } from 'util/interfaces'
import MavisApiBase from 'util/MavisApiBase'

//
// Loads the list of Mavis functions available to be called by our Freehand functions
//

// NOTE:
// This is a very similar implementation to the AutocompleteProvider class
// used for the SQL editor.
// It loads the same functions, but calls a different endpoint
// to get a slightly different response

export interface IFreehandFunction {
  name: string
  display_name: string
  description: string
  kind: string
  output_type: string
  input_fields: InputField[]
  sql: string
}

type InputField = {
  name: string
  kind: string
  data?: string[]
}

class MavisFunctionsLoader extends MavisApiBase {
  private _functions: IFreehandFunction[] = []

  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    super({ getToken, company })
    this._loadFunctions()
  }

  getFunctions = (): IFreehandFunction[] => {
    if (this._functions) {
      return this._functions
    }
    return []
  }

  private _loadFunctions = async () => {
    const endpoint = `/v1/dataset/computed/autocomplete`

    try {
      const response = await this._callApi<{ all_functions: IFreehandFunction[] }>({ endpoint })
      this._functions = response.all_functions
    } catch (err) {
      throw new Error(`Error loading autocomplete functions: ${err instanceof Error ? err.message : err}`)
    }
  }
}

export default MavisFunctionsLoader
