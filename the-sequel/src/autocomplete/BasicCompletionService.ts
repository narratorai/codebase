
import { ITextModel, IPosition, IRange } from "./textInterfaces"
import { IAutocomplete, ICompletionContext, ICompletionResult } from "./autocompleteInterfaces";
import { ICompletionItem } from "..";
import { isInSqlBlock } from "./SqlAutocomplete/queryFunctions";

//
// Basic autocomplete service. Takes a simple json definition
// and uses it to define completions. 
//
// The definition is simply a list of trigger characters and a 
// list of completion items. This just passes it through
//
// See the IBasicCompletionDefinition interface below

const INSERT_AS_SNIPPET = 4

export interface IBasicCompletionDefinition {
  triggerCharacters: string[],
  onlyCompleteBetween?: string[],       // pass two characters e.g. ['{', '}'] to only allow autocomplete between them
  completionItems: ICompletionItem[]
  limitToSqlBlock?: boolean             // to only do autocompletion within a SQL code block
}

type getDefinitionsFunction = () => IBasicCompletionDefinition[]


// Async version of BasicCompletionService
// Takes a function that will eventually return the proper definitions for autocomplete
// Note that it requires the trigger characters in advance
export class BasicCompletionServiceAsync implements IAutocomplete {

  private _getDefinitions: getDefinitionsFunction
  private _definitions: IBasicCompletionDefinition[] = []
  public triggerCharacters: string[] | undefined

  constructor(getDefinitions: getDefinitionsFunction = () => [], triggerCharacters: string[] | undefined = undefined) {

    // Trigger characters are required in the constructor because we need to send them to Monaco
    // when this service gets registered. We haven't written support for async triggers yet
    this._getDefinitions = getDefinitions
    this.triggerCharacters = triggerCharacters
  }

  setDefinitions(definitions: IBasicCompletionDefinition[]) {

    if (definitions.length == 0) {
      return
    }

    definitions.forEach(definition => {

      if (definition.onlyCompleteBetween && definition.onlyCompleteBetween.length != 2) {
        throw "BasicCompletionService: onlyCompleteBetween should have exactly two items"
      }

      definition.completionItems.forEach((item, index) => {

        // Do some runtime type checks since in practice the completion definition is coming from json
        if (!item.label) {
          throw `BasicCompletionService: completion item at index ${index} did not provide a label key`
        }

        if (!item.insertText) {
          throw `BasicCompletionService: completion item with label '${item.label}' did not provide an insertText key`
        }

        if (item.detail && typeof item.detail !== "string") {
          switch(typeof item.detail) {
            case "number": {
              item.detail = (item.detail as number).toString()
              break;
            }
            case "boolean": {
              item.detail = (item.detail as boolean).toString()
              break;
            }
            default: {
              throw `BasicCompletionService: 'detail' must be a string. Item with label '${item.label}' has detail with type ${typeof item.detail}`
            }
          }  
        }

        // Add some required fields that we don't ask for

        if (!item.kind) {
          // kind is an integer between 0 and 25. Only controls which icon
          // monaco shows in the suggestions panel for each item
          item.kind = 12
        }

        item.range = null as any,
        item.insertTextRules = INSERT_AS_SNIPPET
      })
    });

    this._definitions = definitions
   
    // combine all trigger characters into one array -- we want to be called if any definition's trigger matches
    if (!this.triggerCharacters) {
      this.triggerCharacters = definitions.map(d => d.triggerCharacters).reduce((prev, current) => prev.concat(current)) 
    }
  }

  provideCompletionItems(
    content: ITextModel, 
    position: IPosition, 
    context: ICompletionContext) : ICompletionResult {

    if (this._definitions.length == 0) {
      this.setDefinitions(this._getDefinitions())
    }

    let completionItems = {
      suggestions: [] as ICompletionItem[]
    }

    let matchingDefinitions = this._definitions.filter(d => {
      return (

        // filter for the correct trigger char for the given definition
        (d.triggerCharacters.length == 0 || !context.triggerCharacter || d.triggerCharacters.includes(context.triggerCharacter)) &&

        // filter for in between
        (!d.onlyCompleteBetween || this._isBetween(content, position, d.onlyCompleteBetween[0], d.onlyCompleteBetween[1])) &&
        
        // filter for within a sql block
        (!d.limitToSqlBlock || isInSqlBlock(content, position))
      )
    })

    // merge all matching definitions' completion items
    if (matchingDefinitions.length > 0) {
      completionItems.suggestions = matchingDefinitions.map(d => d.completionItems).
          reduce((prev, current) => prev.concat(current)).
          map(item => {
            // make a copy of each definition item before sending it along. Monaco mutates this under the covers
            // so sending them directly leads to problems with the range being set to an old value
            return {...item}
          })
    }

    return completionItems
  }

  // Returns true if the current position is either between the two given characters
  // as in { ... } or ( ... ).
  _isBetween(model: ITextModel, position: IPosition, first: string, second: string) {
    
    if (!first || first.length < 1 || !second || second.length < 1) {
      return false
    }
    
    // force strings to be one character long
    first = first[0]
    second = second [0]

    // \\n is in there to force monaco to do a multi-line search
    const matches = model.findMatches(`[${first}]+([^${second}]|\\n)*[${second}]+`, true, true, false, null, true)

    for(let i = 0; i < matches.length; i++) {
      if (this._isInRange(model, position, matches[i].range)) {
        return true
      }
    }

    return false
  }

  _isInRange(model: ITextModel, position: IPosition, range: IRange) {
    // turn position and range into a single number to compare
    const positionOffset = model.getOffsetAt(position);
    const rangeStart = model.getOffsetAt({ column: range.startColumn, lineNumber: range.startLineNumber })
    const rangeEnd = model.getOffsetAt({ column: range.endColumn, lineNumber: range.endLineNumber })

    return positionOffset >= rangeStart && positionOffset <= rangeEnd
  }
}

export default class BasicCompletionService extends BasicCompletionServiceAsync {
  constructor(definitions: IBasicCompletionDefinition[]) {
    super()
    this.setDefinitions(definitions)
  }
}

