"use client";

import React, { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

function useInView(threshold = 0.18) {
    const ref = useRef<HTMLElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === "undefined") {
            setVisible(true);
            return;
        }

        let done = false;
        let io: IntersectionObserver | null = null;
        const show = () => {
            if (done) return;
            done = true;
            setVisible(true);
            io?.disconnect();
            window.removeEventListener("scroll", onScroll);
        };

        io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) show();
                });
            },
            { threshold, rootMargin: "0px 0px -8% 0px" }
        );
        io.observe(el);

        // Large scroll jumps (anchor links, End key) can teleport past an
        // element without it ever intersecting; reveal anything already passed.
        const onScroll = () => {
            if (done) return;
            requestAnimationFrame(() => {
                if (done) return;
                if (el.getBoundingClientRect().top < 0) show();
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
            io?.disconnect();
            window.removeEventListener("scroll", onScroll);
        };
    }, [threshold]);

    return { ref, visible };
}

type RevealProps = {
    children: ReactNode;
    /** ms before the transition starts once in view */
    delay?: number;
    /** "up" (default) rises in, "scale" zooms in, "media" is a curtain wipe for images */
    variant?: "up" | "scale" | "media";
    as?: ElementType;
    className?: string;
    style?: React.CSSProperties;
};

/** Fades content in when it scrolls into view. */
export function Reveal({ children, delay = 0, variant = "up", as, className = "", style }: RevealProps) {
    const { ref, visible } = useInView();
    const Tag = (as || "div") as ElementType;
    const base =
        variant === "scale" ? "q-reveal-scale" : variant === "media" ? "q-media-reveal" : "q-reveal";

    return (
        <Tag
            ref={ref}
            className={`${base} ${visible ? "is-visible" : ""} ${className}`}
            style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
        >
            {children}
        </Tag>
    );
}

type WordRevealProps = {
    text: string;
    /** ms between each word */
    stagger?: number;
    /** ms before the first word starts */
    delay?: number;
    as?: ElementType;
    className?: string;
    style?: React.CSSProperties;
};

/** Splits a headline into words that rise in one after another. */
export function WordReveal({ text, stagger = 55, delay = 0, as, className = "", style }: WordRevealProps) {
    const { ref, visible } = useInView(0.3);
    const Tag = (as || "span") as ElementType;
    const words = text.split(" ");

    return (
        <Tag ref={ref} className={`q-words ${visible ? "is-visible" : ""} ${className}`} style={style}>
            {words.map((word, i) => (
                <React.Fragment key={i}>
                    <span
                        className="q-word"
                        style={{ ["--word-delay" as string]: `${delay + i * stagger}ms` }}
                    >
                        {word}
                    </span>
                    {i < words.length - 1 ? " " : null}
                </React.Fragment>
            ))}
        </Tag>
    );
}
