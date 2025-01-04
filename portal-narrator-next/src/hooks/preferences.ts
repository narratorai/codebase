import Cookies from 'js-cookie'
import { useToggle } from 'react-use'

export function useMenuExpandedPreference(): [boolean, () => void] {
  const defaultExpanded = Cookies.getJSON('mainMenu:expanded') ?? true
  const [isExpanded, toggleExpanded] = useToggle(defaultExpanded)

  const handleExpandToggle = () => {
    toggleExpanded()
    Cookies.set('mainMenu:expanded', JSON.stringify(!isExpanded))
  }
  return [isExpanded, handleExpandToggle]
}
