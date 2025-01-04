import { DataNode } from 'antd/lib/tree'
import Fuse from 'fuse.js'
import { produce } from 'immer'
import { isEmpty, map, toLower } from 'lodash'

import { HighlightData, ISchemas, ITreeBranch } from './interfaces'

// SCHEMA TREE SEARCH
// on search, highlight the text input entered on: schema, table, column
export const makeHighlightData = (text: string, searchValue: string | null): HighlightData => {
  if (isEmpty(searchValue) || !searchValue) {
    return text
  }

  const startIndex = toLower(text).indexOf(toLower(searchValue))
  // return text as string if no matches found
  if (startIndex === -1) {
    return text
  }

  const beforeStr = text.substring(0, startIndex)
  const highlightedText = text.substring(startIndex, startIndex + searchValue.length)
  const afterStr = text.substring(startIndex + searchValue.length)

  return [beforeStr, highlightedText, afterStr]
}

export const makeHighlightText = (highlightData: HighlightData) => {
  if (typeof highlightData === 'string') {
    return highlightData
  }

  return (
    <span>
      {highlightData[0]}
      <span className="highlighted-value">{highlightData[1]}</span>
      {highlightData[2]}
    </span>
  )
}

export const highlightTree = ({
  expandedKeys,
  treeData,
  searchValue,
}: {
  expandedKeys: string[]
  treeData: DataNode[]
  searchValue: string
}) => {
  // do not mutate the initialTree data
  // highlight on copy
  return produce(treeData, (draft) => {
    map(draft, (node) => {
      if (expandedKeys.includes(node.key as string)) {
        node.title = makeHighlightText(makeHighlightData(node.title as string, searchValue))

        if (node.children) {
          node.children = highlightTree({ expandedKeys, treeData: node.children, searchValue })
        }
      }

      return node
    })
  })
}

// SCHEMA TREE SEARCH
// Convert the api response to tree format ITreeBranch
// use "withStyle" boolean to make sure it's surrounded by Typography component on initial load
export const makeTreeData = (schemasData: ISchemas) => {
  const schemas = Object.keys(schemasData)
  return map(schemas, (schema, schemaIndex) => {
    return {
      title: schema,
      key: `0-${schemaIndex}`,
      children: map(schemasData[schema], (table, tableIndex) => ({
        title: table.table_name,
        key: `0-${schemaIndex}-${tableIndex}`,
        // eslint-disable-next-line max-nested-callbacks
        children: map(table.columns, (column, columnIndex) => ({
          title: column,
          key: `0-${schemaIndex}-${tableIndex}-${columnIndex}`,
        })),
      })),
    }
  })
}

// SCHEMA TREE SEARCH
// fuse search can later be used to search for search input
export const makeFuseSearch = (treeData: ITreeBranch[]) => {
  const list = flattenBranches(treeData)

  const fuseOptions = {
    findAllMatches: false,
    threshold: 0,
    ignoreLocation: true,
    shouldSort: false,
    minMatchCharLength: 2,
    keys: ['title'],
  }

  const fuseIndex = Fuse.createIndex(fuseOptions.keys, list)
  return new Fuse<ITreeBranch>(list, fuseOptions, fuseIndex)
}

const flattenBranches = (branches: ITreeBranch[]): ITreeBranch[] => {
  return branches.reduce<ITreeBranch[]>((acc, branch) => {
    acc.push(branch)

    if (!isEmpty(branch.children) && branch.children) {
      acc = acc.concat(...flattenBranches(branch.children))
    }

    return acc
  }, [])
}
