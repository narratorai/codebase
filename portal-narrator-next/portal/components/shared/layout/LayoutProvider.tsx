import { useCompany } from 'components/context/company/hooks'
import queryString from 'query-string'
import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import useLocalStorage from 'util/useLocalStorage'

interface DoRenderInfiniteScrollProps {
  list: any[]
  visibleList: any[]
  setVisibleList: (list: any[]) => void
  incrementBy?: number
}

interface LayoutProviderProps {
  demoMode: boolean
  introMode: boolean | undefined
  setIntroMode: (value: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  autoCollapsed: boolean
  setAutoCollapsed: (collapsed: boolean) => void
  layoutMainRef?: React.MutableRefObject<HTMLElement | null>
  doRenderInfiniteScroll: ({ list, visibleList, setVisibleList, incrementBy }: DoRenderInfiniteScrollProps) => void
}

const defaultLayoutProviderProps: LayoutProviderProps = {
  demoMode: false,
  introMode: false,
  setIntroMode: () => {},
  collapsed: false,
  setCollapsed: () => {},
  autoCollapsed: false,
  setAutoCollapsed: () => {},
  doRenderInfiniteScroll: () => {},
}

export const LayoutContext = React.createContext<LayoutProviderProps>(defaultLayoutProviderProps)
export const useLayoutContext = () => useContext(LayoutContext)

interface Props {
  children: React.ReactNode
}

const LayoutProvider = ({ children }: Props) => {
  const { search } = useLocation()
  const { intro: introParam } = queryString.parse(search)

  // Storing in localStrage (vs useState) so that it persists across page reloads
  const [collapsed, setCollapsed] = useLocalStorage('layout.collapsed', defaultLayoutProviderProps.collapsed)
  const [autoCollapsed, setAutoCollapsed] = useLocalStorage(
    'layout.autoCollapsed',
    defaultLayoutProviderProps.autoCollapsed
  )

  const [introMode, setIntroMode] = useLocalStorage<boolean | undefined>('layout.introMode', undefined)

  const layoutMainRef = useRef<HTMLElement>(null)

  // this is ONLY designed to render more items in a list that is already fetched
  // this does NOT handle fetching more items
  const doRenderInfiniteScroll = useCallback(
    ({ list, visibleList, setVisibleList, incrementBy = 50 }: DoRenderInfiniteScrollProps) => {
      const layoutElement = layoutMainRef?.current

      if (layoutElement) {
        const scrollTop = layoutElement?.scrollTop || 0
        const docHeight = layoutElement?.scrollHeight || 0
        const winHeight = window.innerHeight
        const scrollPercent = scrollTop / (docHeight - winHeight)

        // if you've reached the 70% of the bottom of the page
        // https://css-tricks.com/how-i-put-the-scroll-percentage-in-the-browser-title-bar/
        if (scrollPercent >= 0.7 && list?.length > 0 && visibleList.length < list.length) {
          const nextListItems = list.slice(visibleList.length, visibleList.length + incrementBy)
          // render <= incrementBy more items in the list
          setVisibleList([...visibleList, ...nextListItems])
        }
      }
    },
    [layoutMainRef]
  )

  const company = useCompany()
  const { demo_company: demoCompany } = company

  useEffect(() => {
    if (!!introParam && introMode === undefined) {
      setIntroMode(true)
    }
  }, [introParam, introMode, setIntroMode])

  return (
    <LayoutContext.Provider
      value={{
        demoMode: demoCompany || defaultLayoutProviderProps.demoMode,
        introMode,
        setIntroMode,
        collapsed,
        setCollapsed,
        autoCollapsed,
        setAutoCollapsed,
        layoutMainRef,
        doRenderInfiniteScroll,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export default LayoutProvider
