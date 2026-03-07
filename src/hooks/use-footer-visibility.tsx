import { useState, useEffect } from "react";

export const useFooterVisibility = () => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const checkFooter = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsFooterVisible(entry.isIntersecting);
        },
        { threshold: 0.5 } // Only hide when 50% of footer is visible
      );

      observer.observe(footer);
      return () => observer.disconnect();
    };

    // Re-check after DOM updates (page navigation)
    const cleanup = checkFooter();
    
    // Also observe DOM changes to catch footer appearing/disappearing
    const mutationObserver = new MutationObserver(() => {
      checkFooter();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (typeof cleanup === 'function') cleanup();
      mutationObserver.disconnect();
    };
  }, []);

  return isFooterVisible;
};
