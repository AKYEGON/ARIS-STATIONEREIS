import { useState, useEffect } from "react";

export const useFooterVisibility = () => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when 10% of footer is visible
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return isFooterVisible;
};
