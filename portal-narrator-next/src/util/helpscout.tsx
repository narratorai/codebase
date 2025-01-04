import Script from 'next/script'

/**
 * Open the chat widget with optional pre-filled fields
 */
export const toggleBeaconWidget = (prefillFields?: Partial<{ subject: string; text: string }>) => {
  // Reset before opening so we clear out any prefilled text:
  // https://developer.helpscout.com/beacon-2/web/javascript-api/#beaconreset
  window.Beacon('reset')

  if (prefillFields) {
    window.Beacon('prefill', { ...prefillFields })
  }

  window.Beacon('toggle')
}

/**
 * Hide the Beacon widget icon.
 *
 * Note that this function only hides the icon; it does not destroy it. The widget can still
 * be opened by the user.
 */
export const hideBeaconWidgetIcon = () => {
  window.Beacon('config', { display: { style: 'manual' } })
}

/** Show the Beacon widget icon. */
export const showBeaconWidgetIcon = () => {
  window.Beacon('config', { display: { style: 'icon' } })
}

/**
 * Load and initialize the HelpScout Beacon widget
 */
export const BeaconScripts = () => (
  <>
    <Script
      id="beacon-load"
      type="text/javascript"
    >{`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`}</Script>

    <Script id="beacon-init" type="text/javascript">
      window.Beacon('init', '46881e9c-8627-4042-9877-8ca45f89731e')
    </Script>
  </>
)
