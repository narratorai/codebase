// loosely based off https://github.com/mozilla/addons-frontend/blob/master/src/core/localState.js

import localForage from 'localforage'
import { reportError } from 'util/errors'

function configureLocalForage() {
  localForage.config({
    name: 'portal-narrator',
    version: '1.0',
  })
}

// Using class here to initialize loading, saving, and clearing based on the same ID
class LocalState {
  constructor(id) {
    this.id = id
    configureLocalForage()
  }

  clear = async () => {
    try {
      await localForage.removeItem(this.id)
    } catch (error) {
      reportError('Error Clearing from localforage', error, { cacheId: this.id })
    }
  }

  load = async () => {
    try {
      const data = await localForage.getItem(this.id)
      if (!data) {
        return null
      }

      return data
    } catch (error) {
      reportError('Error Loading from localforage', error, { cacheId: this.id })
    }
  }

  save = async (data) => {
    try {
      await localForage.setItem(this.id, data)
    } catch (error) {
      reportError('Error Saving to localforage', error, { cacheId: this.id })
    }
  }
}

export default function createLocalState(id) {
  return new LocalState(id)
}
