import React, { useRef } from 'react'
import SqlEditorBase from './SqlEditorBase';
import { SqlEditorProps } from './SqlEditor';

// This is an editor for Markdown with intelligent embedded SQL editing 
// # Markdown with sql
// ```sql
// select * from my_table
// ```


const MarkdownSqlEditor: React.FC<SqlEditorProps> = ({...props}) => {
  
  //
  // Line numbering: grab the current editor value and 
  // add line numbers just on sql blocks
  //
  
  // If a parent passes down a getValueRef we can just use it to get the current
  // value. If not we'll define our own ref to use
  const { getValueRef } = props  
  const valueRef = useRef<() => any | undefined>()

  const getValue = () => {
    if (getValueRef && getValueRef.current) {
      return getValueRef.current()
    } 
    else if (valueRef.current) {
      return valueRef.current()
    }

    return undefined
  }

  // Do special line numbering -- numbers only show up in sql blocks
  let lineMapping: string[] = []
  let lastValue = ""
  function getLineNumber(number: number) : string {
    
    const value = getValue()
    if (value) {

      if (number > lineMapping.length || value !== lastValue) {
        // precompute our line mapping -- we're exploiting javascript's closure behavior
        // to read the value of lineMapping on every subsequent call of getLineNumber
        // we DO NOT want it stored as state, because it will cause a rerender
        lineMapping = numberSqlBlocks(value)
      }
      lastValue = value

      if (number <= lineMapping.length) {
        return lineMapping[number - 1]
      }
    }

    return number.toString()
  }

  function numberSqlBlocks(value: string) : string[] {
    // look for ```sql to start a block and ``` to end a block
    // and build an array with line numbers for each line
  
    const lines = value.split("\n")
    let numbers: string[] = []
  
    let isInBlock = false
    let blockLine = 1
  
    for (const line of lines) {
      if (isInBlock && !line.startsWith("```")) {
        numbers.push(blockLine.toString())
        blockLine++
      } else {
        numbers.push("")
      }

      if (line.startsWith("```sql")) {
        isInBlock = true
        blockLine = 1
      } 
      else if(line.startsWith("```")) {
        isInBlock = false
      }
    }
  
    return numbers
  }

  return (
    <SqlEditorBase
      {...props}
      options = {{
        ...props.options,
        lineNumbers: getLineNumber
      }}
      getValueRef={getValueRef || valueRef}
      language="markdown"
    />
  )
}

export default MarkdownSqlEditor