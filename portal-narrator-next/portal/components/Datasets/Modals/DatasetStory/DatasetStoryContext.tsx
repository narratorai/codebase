import { IDatasetStoryContext } from 'components/Datasets/Modals/DatasetStory/interfaces'
import React from 'react'

const DatasetStoryContext = React.createContext<IDatasetStoryContext>({} as IDatasetStoryContext)

export default DatasetStoryContext
