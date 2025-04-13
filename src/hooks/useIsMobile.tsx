import { useState, useEffect } from "react";

/**
 * useIsMobile - React hook to detect if the viewport is below a given breakpoint.
 * @param breakpoint - The pixel width to consider as the mobile threshold (default: 768)
 * @returns boolean - true if window.innerWidth <= breakpoint, false otherwise
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= breakpoint);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}
