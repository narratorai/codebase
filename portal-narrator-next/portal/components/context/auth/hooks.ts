import { useContext } from 'react'
import { Auth0Context, IAuth0Context } from './Provider'

export const useAuth0 = (): IAuth0Context => useContext(Auth0Context)
