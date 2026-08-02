import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pixelPageView } from "@/lib/pixel";

/** SPA route changes are not page loads, so fire PageView on each navigation. */
const PixelRouteTracker = () => {
  const { pathname, search } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false; // index.html already fired the initial PageView
      return;
    }
    pixelPageView();
  }, [pathname, search]);

  return null;
};

export default PixelRouteTracker;
