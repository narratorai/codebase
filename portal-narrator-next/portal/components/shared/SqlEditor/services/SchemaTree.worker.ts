/* eslint-disable no-case-declarations */
import _ from 'lodash'
import { makeFuseSearch } from './helpers'
import { ITreeBranch } from './interfaces'
import Fuse from 'fuse.js'

import { getLogger } from '@/util/logger'
const logger = getLogger()

interface StartData {
  type: 'start'
  treeData: ITreeBranch[]
}

interface SearchData {
  type: 'search'
  input: string
}

type WorkerEvents = StartData | SearchData

const ctx: Worker = self as unknown as Worker

function start(data: StartData) {
  const startTime = performance.now()
  const fuseSearch = makeFuseSearch(data.treeData)

  ctx.postMessage({
    type: 'started',
  })

  logger.debug(
    {
      duration: performance.now() - startTime,
      treeData: data.treeData,
    },
    'search worker initialize'
  )

  return { fuseSearch }
}

function search(data: SearchData, fuseSearch: Fuse<ITreeBranch> | null) {
  if (fuseSearch === null) {
    return
  }

  const startTime = performance.now()
  const expandedKeys = new Set<string>()

  // only search if there is an input
  if (!_.isEmpty(data.input)) {
    const searchResults = fuseSearch?.search(data.input)
    searchResults.forEach((result) => {
      const parts = result.item.key.split('-')
      parts.forEach((part, idx) => {
        if (idx === 0) {
          // we don't use single digit keys
          return
        }

        expandedKeys.add(parts.slice(0, idx + 1).join('-'))
      })
    })
  }

  ctx.postMessage({
    type: 'searchedResults',
    data: {
      expandedKeys: [...expandedKeys],
    },
    searchValue: data.input,
  })

  logger.debug(
    {
      duration: performance.now() - startTime,
      input: data.input,
      resultSize: expandedKeys.size,
    },
    'search worker searched'
  )
}

let fuseSearch: Fuse<ITreeBranch> | null = null

ctx.addEventListener('message', (evt: MessageEvent<WorkerEvents>) => {
  switch (evt.data.type) {
    case 'start':
      const startResults = start(evt.data)
      fuseSearch = startResults.fuseSearch
      break
    case 'search':
      search(evt.data, fuseSearch)
      break
  }
})
