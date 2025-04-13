import { useEffect, useState } from "react";

/**
 * A hook that returns true if the window matches the given media query,
 * and false otherwise. If SSR, defaults to false until client-side hydration.
 * 
 * @param query The media query to test
 * @returns A boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Check for browser environment (avoid SSR issues)
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);
      
      // Set initial state
      setMatches(media.matches);
      
      // Create handler for changes
      const listener = () => setMatches(media.matches);
      
      // Add listener
      media.addEventListener("change", listener);
      
      // Clean up
      return () => media.removeEventListener("change", listener);
    }
    
    return undefined;
  }, [query]);
  
  return matches;
}

export default useMediaQuery; 