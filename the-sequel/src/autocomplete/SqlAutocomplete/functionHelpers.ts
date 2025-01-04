
// This file is separated from queryFunctions only to provide a way to load
// something while testing without pulling in Monaco.
// TODO: figure out how to get jest to work when Monaco is imported.


// Given an offset (i.e. an index) into a string, returns the start and end offsets of the statement containing it
export const findStatementAroundOffset = (value: string, offset: number) : { startOffset: number, endOffset: number } => {
  // This is meant to be fast; doesn't copy or modify the string and traverses it exactly twice

  // Sanitize input: ignore any semicolons inside strings (i.e.  function('blah ;') )
  // because they obviously don't terminate a statement.
  let skipOffsets = []
  let isInQuote = false
  for (let i = 0; i < value.length; i++) {

    if (isInQuote) {
      if (value[i] === "'") {
        isInQuote = false
      }

      if (value[i] === ';') {
        skipOffsets.push(i)
      }
    }
    else if (value[i] === "'") {
      isInQuote = true
    }
  }


  let firstSemi = -1
  let lastSemi = value.length - 1

  // walk forwards
  for (let i = offset; i < value.length; i++) {
    if (value[i] === ';' && !skipOffsets.includes(i) ) {
      lastSemi = i
      break
    }
  }

  // walk backwards
  for (let i = offset - 1; i > 0; i--) {
    if (value[i] === ';' && !skipOffsets.includes(i)) {
      firstSemi = i
      break
    }
  }

  return { startOffset: firstSemi + 1, endOffset: lastSemi + 1 }
}

export const isLineInSqlBlock = (lineNum: number, value: string) : boolean => {
    const lines = value.split("\n")
    if (lines.length > 1) {
       // walk backwards looking for a start or end of a sql block to tell us what the given line was in
      for (let i = lineNum - 1; i >= 0; i--) {
        const line = lines[i]

        if (line.startsWith("```sql")) {
          // return true unless we're currently on the ```sql line
          return i !== lineNum - 1
        }
        else if (line.startsWith("```")) {
          return false
        }
      }
    }

    return false
  }