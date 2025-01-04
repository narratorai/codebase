import { IDatasetIndexContext } from 'components/Datasets/interfaces'
import { createContext } from 'react'

const DatasetIndexContext = createContext<IDatasetIndexContext>({} as IDatasetIndexContext)

export default DatasetIndexContext
