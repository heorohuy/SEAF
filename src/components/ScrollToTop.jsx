import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // A hash means this is an intentional deep link,
    // e.g. /about#contact.
    if (hash) {
      const element = document.getElementById(hash.slice(1));

      if (element) {
        element.scrollIntoView();
      }

      return;
    }

    // A normal page navigation should start at the top.
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}