<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import ProgressDots from "$lib/components/ui/ProgressDots.svelte";

	export let totalCards: number;
	export let onCardChange: ((index: number) => void) | undefined = undefined;

	const dispatch = createEventDispatcher<{ cardChange: { index: number } }>();

	let currentCard = 0;
	let isTransitioning = false;
	let containerEl: HTMLDivElement;
	let cardsAreaEl: HTMLDivElement;

	// Touch handling
	let touchStartY = 0;
	let touchStartX = 0;

	function goToCard(index: number) {
		if (isTransitioning || index < 0 || index >= totalCards) return;
		if (index === currentCard) return;

		isTransitioning = true;
		currentCard = index;
		if (onCardChange) onCardChange(index);
		dispatch("cardChange", { index });

		setTimeout(() => {
			isTransitioning = false;
		}, 500);
	}

	function nextCard() {
		goToCard(currentCard + 1);
	}

	function prevCard() {
		goToCard(currentCard - 1);
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
			case " ":
				event.preventDefault();
				nextCard();
				break;
			case "ArrowLeft":
			case "ArrowUp":
				event.preventDefault();
				prevCard();
				break;
		}
	}

	function handleTouchStart(event: TouchEvent) {
		touchStartY = event.touches[0].clientY;
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event: TouchEvent) {
		const touchEndY = event.changedTouches[0].clientY;
		const touchEndX = event.changedTouches[0].clientX;

		const diffY = touchStartY - touchEndY;
		const diffX = touchStartX - touchEndX;

		// Minimum swipe distance
		const minSwipe = 50;

		// Swipe horizontally for card navigation.
		if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipe) {
			if (diffX > 0) {
				nextCard();
			} else {
				prevCard();
			}
		}
	}

	function handleClick(event: MouseEvent) {
		// Ignore clicks on buttons or interactive elements
		if ((event.target as HTMLElement).closest("button, a, input, select")) return;

		const rect = cardsAreaEl.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const width = rect.width;

		// Click on right 60% goes forward, left 40% goes back
		if (clickX > width * 0.4) {
			nextCard();
		} else {
			prevCard();
		}
	}

	onMount(() => {
		// Focus for keyboard navigation
		containerEl?.focus();
		// Dispatch initial card event to trigger animations
		dispatch("cardChange", { index: 0 });
	});
</script>

<!--
	Layout (flex column):
	┌─────────────────────────┐
	│  top-bar (progress dots)│  flex-shrink: 0
	├─────────────────────────┤
	│                         │
	│   cards-area  (flex:1)  │  scrollable per-card
	│                         │
	├─────────────────────────┤
	│  bottom-bar (mob arrows)│  flex-shrink: 0 (hidden on desktop)
	└─────────────────────────┘
	Desktop side-nav arrows are absolute inside cards-area.
-->
<div
	class="card-stack"
	bind:this={containerEl}
	tabindex="0"
	role="region"
	aria-label="Wrapped story cards"
	on:keydown={handleKeydown}
>
	<!-- ① Progress dots — always visible at top, never overlaps cards -->
	<div class="top-bar">
		<slot
			name="progress"
			{goToCard}
			current={currentCard}
			total={totalCards}
		>
			<ProgressDots
				total={totalCards}
				current={currentCard}
				onSelect={(index) => goToCard(index)}
			/>
		</slot>
	</div>

	<!-- ② Cards area — fills remaining space, handles swipe & click -->
	<div
		class="cards-area"
		bind:this={cardsAreaEl}
		on:touchstart={handleTouchStart}
		on:touchend={handleTouchEnd}
		on:click={handleClick}
	>
		{#each Array(totalCards) as _, i}
			<div
				class="card-wrapper"
				class:active={i === currentCard}
				class:prev={i < currentCard}
				class:next={i > currentCard}
			>
				<slot
					currentIndex={currentCard}
					cardIndex={i}
					isActive={i === currentCard}
				/>
			</div>
		{/each}

		<!-- Desktop-only side nav arrows, positioned inside cards-area -->
		{#if currentCard > 0}
			<button
				class="side-nav-btn side-prev"
				on:click|stopPropagation={prevCard}
				aria-label="Previous card"
			>
				<span aria-hidden="true">←</span>
			</button>
		{/if}
		{#if currentCard < totalCards - 1}
			<button
				class="side-nav-btn side-next"
				on:click|stopPropagation={nextCard}
				aria-label="Next card"
			>
				<span aria-hidden="true">→</span>
			</button>
		{/if}
	</div>

	<!-- ③ Bottom bar — mobile arrow nav, real layout space so it never overlaps -->
	<div class="bottom-bar">
		{#if currentCard > 0}
			<button
				class="mob-nav-btn"
				on:click|stopPropagation={prevCard}
				aria-label="Previous card"
			>
				<span aria-hidden="true">←</span>
			</button>
		{/if}
		{#if currentCard < totalCards - 1}
			<button
				class="mob-nav-btn"
				on:click|stopPropagation={nextCard}
				aria-label="Next card"
			>
				<span aria-hidden="true">→</span>
			</button>
		{/if}
	</div>
</div>

<style>
	/* ─── Outer shell ─────────────────────────────────────────────────── */
	.card-stack {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		outline: none;
		background: #0a0a0a;
	}

	/* ─── Top bar (progress dots) ─────────────────────────────────────── */
	.top-bar {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.75rem 1rem 0.5rem;
		z-index: 100;
		/* Dots are buttons with their own pointer events; parent can be none */
		pointer-events: none;
	}

	/* Re-enable pointer events for interactive children */
	.top-bar :global(button),
	.top-bar :global(a) {
		pointer-events: auto;
	}

	/* ─── Cards area ──────────────────────────────────────────────────── */
	.cards-area {
		/* Fill all remaining vertical space between top-bar and bottom-bar */
		flex: 1;
		min-height: 0; /* critical: lets flex child shrink below content height */
		position: relative;
		overflow: hidden;
	}

	/* ─── Individual card wrappers ────────────────────────────────────── */
	.card-wrapper {
		position: absolute;
		inset: 0;
		/* Allow card content to scroll vertically when taller than viewport */
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior-y: contain;
		-webkit-overflow-scrolling: touch;
		scrollbar-gutter: stable;

		/* Default (hidden) state */
		opacity: 0;
		transform: scale(0.9) translateY(20px);
		filter: blur(10px);
		pointer-events: none;
		transition:
			opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1),
			transform 0.8s cubic-bezier(0.19, 1, 0.22, 1),
			filter 0.8s cubic-bezier(0.19, 1, 0.22, 1);
		z-index: 1;
		will-change: transform, opacity, filter;
	}

	.card-wrapper :global(.card-base) {
		height: auto;
		min-height: 100%;
	}

	.card-wrapper.active {
		opacity: 1;
		transform: scale(1) translateY(0);
		filter: blur(0);
		pointer-events: auto;
		z-index: 10;
	}

	.card-wrapper.prev {
		opacity: 0;
		transform: scale(1.1) translateY(-50px);
		filter: blur(20px);
		z-index: 5;
	}

	.card-wrapper.next {
		opacity: 0;
		transform: scale(0.95) translateY(50px);
		filter: blur(10px);
		z-index: 5;
	}

	/* ─── Desktop side-nav arrows (inside cards-area) ─────────────────── */
	.side-nav-btn {
		display: none; /* hidden on mobile */
	}

	@media (min-width: 768px) {
		.side-nav-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			z-index: 200;
			width: 40px;
			height: 40px;
			background: rgba(20, 20, 20, 0.9);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 50%;
			color: rgba(255, 255, 255, 0.7);
			font-family: "JetBrains Mono", monospace;
			font-size: 1.25rem;
			cursor: pointer;
			pointer-events: auto;
			transition: all 0.2s ease;
		}

		.side-nav-btn span {
			display: block;
			line-height: 1;
		}

		.side-prev {
			left: 2rem;
		}

		.side-next {
			right: 2rem;
		}

		.side-nav-btn:hover {
			background: rgba(29, 185, 84, 0.2);
			border-color: rgba(29, 185, 84, 0.3);
			color: #1db954;
		}
	}

	/* ─── Bottom bar (mobile arrows) ──────────────────────────────────── */
	.bottom-bar {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem 0.75rem;
		min-height: 3rem; /* reserve space even when empty so layout is stable */
	}

	/* Hide bottom bar entirely on desktop (side-nav-btn takes over) */
	@media (min-width: 768px) {
		.bottom-bar {
			display: none;
		}
	}

	.mob-nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: rgba(20, 20, 20, 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		color: rgba(255, 255, 255, 0.7);
		font-family: "JetBrains Mono", monospace;
		font-size: 1.1rem;
		cursor: pointer;
		opacity: 0.7;
		transition: all 0.2s ease;
	}

	.mob-nav-btn span {
		display: block;
		line-height: 1;
	}

	.mob-nav-btn:active {
		opacity: 1;
		background: rgba(29, 185, 84, 0.2);
		border-color: rgba(29, 185, 84, 0.3);
		color: #1db954;
	}
</style>
