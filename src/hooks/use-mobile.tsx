import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook that checks if the current viewport is mobile-sized
 * @param breakpoint Custom breakpoint value (default: 768px)
 * @returns boolean indicating if viewport is mobile-sized
 */
export function useMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkIsMobile()

    // Add event listener
    window.addEventListener("resize", checkIsMobile)

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [breakpoint])

  return isMobile
}

/**
 * Alias for useMobile to maintain backward compatibility
 * @returns boolean indicating if viewport is mobile-sized
 */
export const useIsMobile = useMobile

// Also export as default for imports like: import useIsMobile from "./use-mobile"
export default useMobile

