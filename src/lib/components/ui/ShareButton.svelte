<script lang="ts">
    import html2canvas from "html2canvas";
    import { UNICODE } from "$lib/utils/format";

    export let targetId: string;
    export let fileName: string = "emby-wrapped.png";
    export let label: string = "Share";

    let isGenerating = false;

    async function captureAndShare() {
        const element = document.getElementById(targetId);
        if (!element || isGenerating) return;

        isGenerating = true;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: "#0a0a0a",
                scale: 2,
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById(targetId);
                    if (!el) return;

                    // Mark snapshot mode for any CSS that needs it
                    el.classList.add("snapshot-mode");

                    // ── 1. Hide the share button itself ──────────────────────
                    el.querySelectorAll<HTMLElement>(".share-container").forEach(
                        (e) => (e.style.display = "none")
                    );

                    // ── 2. Fix gradient text (html2canvas can't render -webkit-background-clip:text) ──
                    // Walk every element; if it uses the gradient-clip trick, replace with a solid color.
                    el.querySelectorAll<HTMLElement>("*").forEach((node) => {
                        const s = window.getComputedStyle(node);
                        if (
                            s.getPropertyValue("-webkit-text-fill-color") === "transparent" ||
                            s.getPropertyValue("-webkit-background-clip") === "text"
                        ) {
                            const bg = s.backgroundImage;
                            // Pull the first recognisable colour stop from the gradient
                            const m = bg.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
                            const color = m ? m[0] : "#ffffff";
                            node.style.setProperty("-webkit-text-fill-color", color, "important");
                            node.style.setProperty("color", color, "important");
                            node.style.setProperty("background", "none", "important");
                            node.style.setProperty("background-image", "none", "important");
                            node.style.setProperty("-webkit-background-clip", "unset", "important");
                            node.style.setProperty("background-clip", "unset", "important");
                        }
                    });

                    // ── 3. Reveal ALL animated elements ──────────────────────
                    // Each card hides sections with opacity:0 + transform + sometimes filter.
                    // We reset every element that is currently invisible.
                    el.querySelectorAll<HTMLElement>("*").forEach((node) => {
                        const s = window.getComputedStyle(node);
                        // Only touch elements that are actually hidden
                        if (parseFloat(s.opacity) < 0.1) {
                            node.style.setProperty("opacity", "1", "important");
                            node.style.setProperty("transform", "none", "important");
                            node.style.setProperty("filter", "none", "important");
                            node.style.setProperty("visibility", "visible", "important");
                        } else if (s.filter && s.filter !== "none") {
                            // Visible but still blurred (e.g. poster entering mid-animation)
                            node.style.setProperty("filter", "none", "important");
                        }
                    });

                    // ── 4. IntroCard layout fix ───────────────────────────────
                    // year-lockup is position:absolute and overlaps the profile section.
                    // Convert the container to a simple vertical stack.
                    const introContainer = el.querySelector<HTMLElement>(".intro-container");
                    if (introContainer) {
                        introContainer.style.setProperty("height", "auto", "important");
                        introContainer.style.setProperty("justify-content", "flex-start", "important");
                        introContainer.style.setProperty("padding-top", "3rem", "important");
                        introContainer.style.setProperty("gap", "2rem", "important");
                    }
                    const yearLockup = el.querySelector<HTMLElement>(".year-lockup");
                    if (yearLockup) {
                        yearLockup.style.setProperty("position", "relative", "important");
                        yearLockup.style.setProperty("top", "auto", "important");
                        yearLockup.style.setProperty("left", "auto", "important");
                        yearLockup.style.setProperty("transform", "none", "important");
                        yearLockup.style.setProperty("opacity", "1", "important");
                    }
                    const bridgeText = el.querySelector<HTMLElement>(".bridge-text");
                    if (bridgeText) {
                        bridgeText.style.setProperty("display", "none", "important");
                    }

                    // ── 5. GenreCard: replace conic-gradient ring with SVG ───
                    // html2canvas doesn't support conic-gradient.
                    const heroRing = el.querySelector<HTMLElement>(".hero-ring");
                    if (heroRing) {
                        const percent = parseFloat(
                            heroRing.style.getPropertyValue("--percent") || "0"
                        );
                        const ringColor =
                            heroRing.style.getPropertyValue("--color") || "#1db954";
                        const r = 54, cx = 60, cy = 60;
                        const circ = 2 * Math.PI * r;
                        const filled = (percent / 100) * circ;
                        heroRing.style.background = "none";
                        heroRing.style.position = "relative";
                        heroRing.innerHTML = `
                            <svg width="120" height="120"
                                 style="position:absolute;top:0;left:0;transform:rotate(-90deg)">
                                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                                    stroke="rgba(255,255,255,0.1)" stroke-width="12"/>
                                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                                    stroke="${ringColor}" stroke-width="12"
                                    stroke-dasharray="${filled} ${circ}"
                                    stroke-linecap="round"/>
                            </svg>
                            <div style="position:relative;z-index:1;width:90px;height:90px;
                                        border-radius:50%;background:#0a0a0a;
                                        display:flex;align-items:center;justify-content:center;">
                                <span style="font-family:monospace;font-size:1.25rem;
                                             font-weight:700;color:#fff;">
                                    ${Math.round(percent)}%
                                </span>
                            </div>`;
                    }
                },
            });

            const image = canvas.toDataURL("image/png");

            if (navigator.share) {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], fileName, { type: "image/png" });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: "My Emby Wrapped",
                        text: "Check out my year in Review!",
                    });
                } else {
                    downloadImage(image);
                }
            } else {
                downloadImage(image);
            }
        } catch (err) {
            console.error("Sharing failed:", err);
            try {
                const element = document.getElementById(targetId);
                if (element) {
                    const canvas = await html2canvas(element, {
                        backgroundColor: "#0a0a0a",
                        scale: 2,
                        useCORS: true,
                        logging: false,
                    });
                    downloadImage(canvas.toDataURL("image/png"));
                }
            } catch {
                alert("Could not generate image. Please try again.");
            }
        } finally {
            isGenerating = false;
        }
    }

    function downloadImage(dataUrl: string) {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    }
</script>

<button
    class="share-btn"
    on:click|stopPropagation={captureAndShare}
    disabled={isGenerating}
    aria-label="Share this card"
>
    <span class="icon">{isGenerating ? UNICODE.dots : "↗"}</span>
    <span class="label">{isGenerating ? "..." : label}</span>
</button>

<style>
    .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: rgba(20, 20, 20, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 0.625rem 1.25rem;
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.85);
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 36px;
        min-width: 36px;
    }

    .share-btn:hover:not(:disabled) {
        background: rgba(29, 185, 84, 0.3);
        border-color: rgba(29, 185, 84, 0.5);
        color: white;
        transform: scale(1.05);
    }

    .share-btn:active:not(:disabled) {
        transform: scale(0.96);
    }

    .share-btn:disabled {
        opacity: 0.7;
        cursor: wait;
    }

    .icon {
        font-size: 1rem;
        line-height: 1;
        pointer-events: none;
    }

    .label {
        line-height: 1;
        pointer-events: none;
    }

    @media (max-width: 600px) {
        .share-btn {
            padding: 0.625rem 1rem;
            font-size: 0.75rem;
        }
        .label {
            display: none;
        }
    }
</style>
