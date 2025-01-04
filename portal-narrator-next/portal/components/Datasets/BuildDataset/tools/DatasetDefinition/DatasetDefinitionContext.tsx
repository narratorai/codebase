import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import React from 'react'
const DatasetDefinitionContext = React.createContext<IDatasetDefinitionContext>({} as IDatasetDefinitionContext)

export default DatasetDefinitionContext
