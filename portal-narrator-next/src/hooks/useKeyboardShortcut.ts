import { HotkeyCallback, useHotkeys } from 'react-hotkeys-hook'

/**
 * Hook to handle keyboard shortcuts.
 *
 * @param shortcuts
 * @param callback
 */
export default function useKeyboardShortcut(shortcuts: string | string[], callback: HotkeyCallback) {
  useHotkeys(shortcuts, callback, { enableOnContentEditable: true, enableOnFormTags: true, preventDefault: true })
}
