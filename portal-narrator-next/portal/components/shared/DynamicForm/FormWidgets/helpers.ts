import { each, map, includes, isEmpty, compact } from 'lodash'

export interface TreeItem {
  value: string
  title: string
  selectable?: boolean
  children?: TreeItem[]
}

interface CleanTreeItemProps {
  treeItem: TreeItem
  enumValues: string[]
}

export const cleanTreeItem = ({ treeItem, enumValues }: CleanTreeItemProps) => {
  const updatedChildren: TreeItem[] = []
  // if item has children
  if (treeItem.children) {
    // loop through all children
    each(treeItem.children, (subTreeItem) => {
      // if this child has children
      // clean each of those tree items (all the way down)
      if (!isEmpty(subTreeItem.children)) {
        const nestedChildren = cleanTreeItem({ treeItem: subTreeItem, enumValues })

        // don't include empty dropdowns
        if (nestedChildren?.selectable === false && !isEmpty(nestedChildren?.children)) {
          updatedChildren.push(nestedChildren)
        }
      }

      // and only keep children whose values belong to enumValues
      if (includes(enumValues, subTreeItem.value)) {
        updatedChildren.push(subTreeItem)
      }
    })
  }

  const updatedTreeItem = {
    ...treeItem,
    children: updatedChildren,
  }

  if (updatedTreeItem.selectable === false && isEmpty(updatedChildren)) {
    return undefined
  }

  return updatedTreeItem
}

interface CleanTreeDataProps {
  treeData: TreeItem[]
  enumValues: string[]
}

export const cleanTreeData = ({ treeData, enumValues }: CleanTreeDataProps) => {
  return compact(map(treeData, (treeItem) => cleanTreeItem({ treeItem, enumValues })))
}
