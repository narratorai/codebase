import { IRange, ITextModel, IPosition } from "../textInterfaces";
import { findStatementAroundOffset, isLineInSqlBlock } from "./functionHelpers";

// It's very important that we don't import anything directly from 'monaco-editor' (the package)
// Doing so will bring in all its code. We have what we need in 'monaco' instead
import monaco from "../../monaco"
type Range = monaco.Range

//
// Return the range of the query closest to the current cursor position
// Uses ONLY semicolons to distinguish between queries
//
// Also knows to ask if the cursor is within sql code at all (for the special case of
// a markdown editor supporting sql)
//
const currentQueryRange = (model: ITextModel, position: IPosition) : IRange | null => {
  let range

  // Check if we're even within a potential sql block before computing everything below
  const sqlRange = getSqlRangeAtPosition(model, position) as Range
  if (!sqlRange) {
    return null
  }

  // offset is a single number for position -- like an index into an array
  // we'll use it to find where the position is in relation to the found semicolons
  const fullOffset = model.getOffsetAt(position);
  const sqlOffset = model.getOffsetAt(sqlRange.getStartPosition())

  // find the start and end of the sql statement within the given range
  const fullValue = model.getValueInRange(sqlRange)
  const statementOffsets = findStatementAroundOffset(fullValue, fullOffset - sqlOffset)

  // convert offsets back into the full query range
  const startPosition = model.getPositionAt(statementOffsets.startOffset + sqlOffset)
  const endPosition = model.getPositionAt(statementOffsets.endOffset + sqlOffset)

  range = {
    startLineNumber: startPosition.lineNumber,
    startColumn: startPosition.column,
    endLineNumber: endPosition.lineNumber,
    endColumn: endPosition.column
  }

  // Note we don't have to trim the end -- finding a query ends exactly on a semicolon
  range = trimRangeStart(model, range)

  // last check: trim to the actual sql range
  return sqlRange.intersectRanges(range)
}


// Trims whitespace off a range
const trimRangeStart = (model: ITextModel, range: IRange) : IRange => {
  
  // Just look at each line for content -- if there's any then we keep it in the range
  let lineNumber = range.startLineNumber
  let column = range.startColumn

  // first line is a special case -- it can have non-whitespace before our range starts
  if (model.getLineLastNonWhitespaceColumn(lineNumber) <= range.startColumn) {
    lineNumber++
    column = 0
  }

  // all next lines have to be fully blank
  while(lineNumber < range.endLineNumber && model.getLineFirstNonWhitespaceColumn(lineNumber) == 0) {
    lineNumber++
  }

  range = {
    ...range, 
    startLineNumber: lineNumber,
    startColumn: column
  }

  return model.validateRange(range)
}

const isMarkdown = (model: ITextModel): boolean => {
  return model.getModeId() === "markdown"
}

export const isInSqlBlock = (model: ITextModel, position: IPosition) : boolean => {

  if (!isMarkdown(model)) {
    // assume any other language is a sql-compatible language
    return true
  }

  return isLineInSqlBlock(position.lineNumber, model.getValue()) 
}

export const intersectWithSqlRange = (model: ITextModel, position: IPosition, range: IRange) : IRange | null => {
  const sqlRange = getSqlRangeAtPosition(model, position) as Range
  return sqlRange?.intersectRanges(range)
}

// Returns a range if the current position is in a block of SQL code
const getSqlRangeAtPosition = (model: ITextModel, position: IPosition) : IRange | null => {
  
  if (!isMarkdown(model)) {
    // assume any other language is a sql-compatible language
    return model.getFullModelRange()
  }

  let range = null

  // Matches
  // ```sql
  // <anything> 
  // ```
  // i.e. a complete sql block
  let matches = model.findMatches('```sql\\s*\\n(.|\\n)*?\\n```\\s*?(\\n|$)', true, true, false, null, true)
  let completeBlockLines = [] as number[] // remember which line complete blocks started on

  matches.forEach(match => {
    const matchRange = match.range as Range
    const matchString = (match.matches as string[])[0]
    completeBlockLines.push(matchRange.startLineNumber)
    if (matchRange.containsPosition(position)) {
      const startLine = matchRange.startLineNumber + 1

      // ``` is a legal way to end a block but ```hi is not. So we enforce that it ends in a new line or end of file, which
      // means we have to strip off an additional matched line if it ends in a new line
      const endLine = matchString[matchString.length -1] === "\n" ? matchRange.endLineNumber - 2 : matchRange.endLineNumber - 1
      range = new monaco.Range(startLine, 0,
                        endLine, model.getLineLastNonWhitespaceColumn(endLine))
    }
  })

  // If none of the complete blocks worked find the last uncompleted one
  // that starts before the current position and return that as a block
  if (!range) {
    // just search for ```sql and extend the match all the way to the end of the editor
    matches = model.findMatches('```sql', true, false, false, null, true)
    const fullRange = model.getFullModelRange()

    matches.forEach(match => {
      const matchRange = new monaco.Range(
        match.range.startLineNumber, 
        match.range.startColumn,
        fullRange.endLineNumber,
        fullRange.endColumn
      )

      // don't use this unclosed match if it's actually one of the closed ones above
      if (!completeBlockLines.includes(matchRange.startLineNumber) && 
          matchRange.containsPosition(position)) {
        const startLine = matchRange.startLineNumber + 1
        const endLine = matchRange.endLineNumber  // not -1 like above b/c we don't need to get rid of ```
        range = new monaco.Range(startLine, 0,
                          endLine, matchRange.endColumn)
      }
    })
  }
  
  return range
}

export default currentQueryRange
