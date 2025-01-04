// see <Page> for logic around hiding/showing helpscout chat beacon

export const hideChatButton = () => {
  window.Beacon('config', { display: { style: 'manual' } })
}

export const showChatButton = () => {
  window.Beacon('config', { display: { style: 'icon' } })
}

export const showChatMessage = (messageId: string) => {
  window.Beacon('show-message', messageId, { force: true, delay: 1 }) // delay: default is 3000; apparently 0 doesn't work
}

interface PrefillChatProps {
  subject?: string
  text?: string
}

export const openChat = (prefillFields?: PrefillChatProps) => {
  // Reset before opening so we clear out any prefilled text:
  // https://developer.helpscout.com/beacon-2/web/javascript-api/#beaconreset
  window.Beacon('reset')

  if (prefillFields) {
    window.Beacon('prefill', { ...prefillFields })
  }

  // Then open chat beacon:
  window.Beacon('open')
}
