import { Grid } from 'antd-next'
import { useMemo } from 'react'

const { useBreakpoint: useAntdBreakpoint } = Grid

interface IResponse {
  isMobile: boolean
  currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
}

const useBreakpoint = (): IResponse => {
  const breakpoint = useAntdBreakpoint()

  const isMobile = useMemo(() => {
    return !!((breakpoint.xs || breakpoint.sm) && !breakpoint.md)
  }, [breakpoint])

  const currentBreakpoint = useMemo(() => {
    if (breakpoint.xxl) {
      return 'xxl'
    }

    if (breakpoint.xl) {
      return 'xl'
    }

    if (breakpoint.lg) {
      return 'lg'
    }

    if (breakpoint.md) {
      return 'md'
    }

    if (breakpoint.sm) {
      return 'sm'
    }

    return 'xs'
  }, [breakpoint])

  return {
    isMobile,
    currentBreakpoint,
  }
}

export default useBreakpoint
