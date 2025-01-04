import { ITaskTrackerContext } from 'components/TaskTracker/interfaces'
import React from 'react'

const TaskTrackerContext = React.createContext<ITaskTrackerContext>({} as ITaskTrackerContext)

export default TaskTrackerContext
