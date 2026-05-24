import { useEffect, useRef } from 'react';

export function useScrollReveal(selector = null, threshold = 0.18) {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const targets = selector
      ? Array.from(container.querySelectorAll(selector))
      : [container];

    const observers = targets.map((el) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('scroll-revealed');
            obs.disconnect();
          }
        },
        { threshold }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [selector, threshold]);
  return ref;
}
