import React, { useEffect, useRef } from "react";

export default function Testimonials() {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    let start = 0;
    const tick = () => {
      start += 0.5; // scroll speed (lower = slower)
      el.scrollLeft = start % Math.max(1, el.scrollWidth - el.clientWidth);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = [
    { quote: "We saw progress in weeks—our child looks forward to sessions!", author: "Parent, NYC" },
    { quote: "Matching was seamless and culturally responsive.", author: "Parent, NJ" },
    { quote: "As an SLP, I love the supportive, admin-light setup.", author: "SLP, Remote" },
    { quote: "The teletherapy option fit our schedule perfectly.", author: "Parent, CT" },
  ];

  return (
    <section className="border-y bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-brand">What families & SLPs say</h2>
          <p className="font-body mx-auto mt-2 max-w-xl text-neutral-600">Short, honest quotes from real people.</p>
        </div>

        <div
          ref={scroller}
          className="mt-8 flex snap-x overflow-x-auto gap-4 p-1 [scrollbar-width:none]"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((t, i) => (
            <figure
              key={i}
              className="min-w-[280px] snap-start rounded-2xl border border-brand/20 bg-white p-5 shadow-sm sm:min-w-[360px]"
            >
              <blockquote className="font-body text-sm text-neutral-800">“{t.quote}”</blockquote>
              <figcaption className="mt-3 text-xs text-neutral-500">— {t.author}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
