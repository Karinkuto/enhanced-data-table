"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"

interface PortalProps extends React.PropsWithChildren {
  /**
   * Specify a container element.
   */
  container?: HTMLElement
}

export const Portal: React.ForwardRefRenderFunction<HTMLDivElement, PortalProps> = (
  { children, container },
  forwardedRef,
) => {
  const [el, setEl] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (container) {
      setEl(container)
    } else {
      setEl(document.createElement("div"))
    }
  }, [container])

  React.useEffect(() => {
    if (el && !container) {
      document.body.appendChild(el)
    }

    return () => {
      if (el && !container && document.body.contains(el)) {
        document.body.removeChild(el)
      }
    }
  }, [el, container])

  if (!el) {
    return null
  }

  return ReactDOM.createPortal(<div ref={forwardedRef}>{children}</div>, el)
}

export default React.forwardRef(Portal)
