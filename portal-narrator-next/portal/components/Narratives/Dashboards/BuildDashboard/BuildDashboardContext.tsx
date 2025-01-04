import { IBuildDashboardContext } from 'components/Narratives/Dashboards/BuildDashboard/interfaces'
import React from 'react'

const BuildDashboardContext = React.createContext<IBuildDashboardContext>({} as IBuildDashboardContext)

export default BuildDashboardContext
