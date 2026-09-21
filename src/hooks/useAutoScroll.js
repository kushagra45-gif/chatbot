import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Smart Auto-Scroll Hook for chat interfaces
 */
export function useAutoScroll(dependency) {
  const containerRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const userHasScrolledUpRef = useRef(false);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
      userHasScrolledUpRef.current = false;
      setIsScrolledUp(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    // If more than 120px from bottom, consider user has intentionally scrolled up
    if (distanceToBottom > 120) {
      userHasScrolledUpRef.current = true;
      setIsScrolledUp(true);
    } else {
      userHasScrolledUpRef.current = false;
      setIsScrolledUp(false);
    }
  }, []);

  useEffect(() => {
    // Only scroll automatically if the user hasn't explicitly scrolled up
    if (!userHasScrolledUpRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [dependency]);

  return {
    containerRef,
    isScrolledUp,
    scrollToBottom,
    handleScroll,
  };
}
