const useScrollEvents = (onScrollEnd?: () => void) => {
  const handleScroll = (event: React.UIEvent) => {
    const { target } = event
    const { offsetHeight, scrollHeight, scrollTop } = target as HTMLDivElement

    if (scrollHeight - scrollTop <= offsetHeight + 1) {
      onScrollEnd?.()
    }
  }

  return handleScroll
}

export default useScrollEvents
