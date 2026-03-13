<script lang="ts">
	import { onMount } from "svelte";
	import { UNICODE } from "$lib/utils/format";
	import type { TopItem } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let topItem: TopItem;
	export let type: "show" | "movie";
	export let rank: number = 1;

	let visible = false;
	let phase = 0; // 0=hidden, 1=label, 2=poster, 3=title, 4=stats
	let imageLoaded = false;
	let primaryImageError = false;
	let fallbackImageError = false;

	onMount(() => {
		setTimeout(() => {
			visible = true;
			startNarrative();
		}, 100);
	});

	function startNarrative() {
		const timeline = [
			{ phase: 1, delay: 0 }, // "Your #1 Show/Movie"
			{ phase: 2, delay: 600 }, // Poster reveal (dramatic)
			{ phase: 3, delay: 1800 }, // Title appears
			{ phase: 4, delay: 2600 }, // Stats fade in
		];
		timeline.forEach(({ phase: p, delay }) => {
			setTimeout(() => {
				phase = p;
			}, delay);
		});
	}

	$: hours = Math.round(topItem.minutes / 60);
	$: label = type === "show" ? "Show" : "Movie";
	function proxyUrl(url: string): string {
		return `/api/proxy-image?url=${encodeURIComponent(url)}`;
	}

	$: currentImageUrl = proxyUrl(
		primaryImageError && topItem.tmdbImageUrl
			? topItem.tmdbImageUrl
			: topItem.imageUrl
	);
	$: showFallbackGradient =
		primaryImageError && (fallbackImageError || !topItem.tmdbImageUrl);
	$: cardId = `top-${type}-${rank}-card`;

	function getGradientFromName(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue1 = Math.abs(hash % 360);
		const hue2 = (hue1 + 40) % 360;
		return `linear-gradient(135deg, hsl(${hue1}, 70%, 35%) 0%, hsl(${hue2}, 60%, 25%) 100%)`;
	}

	$: fallbackGradient = getGradientFromName(topItem.name);

	function handlePrimaryError() {
		primaryImageError = true;
	}
	function handleFallbackError() {
		fallbackImageError = true;
	}
</script>

<div class="card-base" class:visible id={cardId}>
	<div class="share-container">
		<ShareButton targetId={cardId} fileName="emby-wrapped-top-{type}.png" />
	</div>

	<!-- Background image - blurred -->
	{#if !showFallbackGradient}
		<div class="bg-image" class:loaded={imageLoaded && phase >= 2}>
			<img
				src={currentImageUrl}
				alt=""
				on:load={() => (imageLoaded = true)}
				on:error={primaryImageError
					? handleFallbackError
					: handlePrimaryError}
			/>
		</div>
	{/if}
	<div
		class="bg-fallback"
		class:show={showFallbackGradient}
		style="background: {fallbackGradient}"
	></div>
	<div class="bg-overlay"></div>

	<div class="card-content">
		<!-- Phase 1: Label with dramatic entrance -->
		<div class="label-section" class:show={phase >= 1}>
			<span class="label-line left"></span>
			<p class="label">
				<span class="unicode">{UNICODE.diamond}</span>
				Your #{rank}
				{label}
			</p>
			<span class="label-line right"></span>
		</div>

		<!-- Phase 2: Poster with scale reveal -->
		<div class="poster-section" class:show={phase >= 2}>
			<div class="poster-frame">
				{#if !showFallbackGradient}
					<img
						src={currentImageUrl}
						alt={topItem.name}
						class="poster"
						on:error={primaryImageError
							? handleFallbackError
							: handlePrimaryError}
					/>
				{:else}
					<div
						class="poster-fallback"
						style="background: {fallbackGradient}"
					>
						<span class="fallback-initial"
							>{topItem.name.charAt(0)}</span
						>
						<span class="fallback-title">{topItem.name}</span>
					</div>
				{/if}
			</div>
			<div class="poster-glow"></div>
		</div>

		<!-- Phase 3: Title -->
		<div class="title-section" class:show={phase >= 3}>
			<h2 class="title font-display">{topItem.name}</h2>
		</div>

		<!-- Phase 4: Stats -->
		<div class="stats-section" class:show={phase >= 4}>
			{#if type === "show" && topItem.episodes}
				<div class="stat">
					<span class="stat-value font-mono">{topItem.episodes}</span>
					<span class="stat-label">episodes</span>
				</div>
				<span class="stat-divider">{UNICODE.separator}</span>
			{/if}
			<div class="stat">
				<span class="stat-value font-mono">{hours}</span>
				<span class="stat-label">hours</span>
			</div>
			{#if topItem.count > 1}
				<span class="stat-divider">{UNICODE.separator}</span>
				<div class="stat">
					<span class="stat-value font-mono">{topItem.count}×</span>
					<span class="stat-label">plays</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.card-base {
		position: relative;
		width: 100%;
		min-height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		opacity: 0;
		transition: opacity 0.4s ease;
		overflow: hidden;
	}

	.card-base.visible {
		opacity: 1;
	}

	.share-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 200;
		/* Add a generous invisible tap area around the container */
		padding: 0.5rem;
		margin: -0.5rem;
	}

	:global(.snapshot-mode) .share-container {
		display: none !important;
	}

	:global(.snapshot-mode) .label-section,
	:global(.snapshot-mode) .poster-section,
	:global(.snapshot-mode) .title-section,
	:global(.snapshot-mode) .stats-section {
		opacity: 1 !important;
		transform: none !important;
		filter: none !important;
	}

	:global(.snapshot-mode) .bg-image {
		opacity: 0.4 !important;
	}

	/* Background */
	.bg-image {
		position: absolute;
		inset: -30px;
		opacity: 0;
		transition: opacity 1.2s ease;
	}

	.bg-image.loaded {
		opacity: 1;
	}

	.bg-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(40px) brightness(0.25) saturate(1.3);
		transform: scale(1.15);
	}

	.bg-fallback {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.5s ease;
	}

	.bg-fallback.show {
		opacity: 1;
	}

	.bg-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(10, 10, 10, 0.3) 0%,
			rgba(10, 10, 10, 0.6) 50%,
			rgba(10, 10, 10, 0.95) 100%
		);
	}

	.card-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		max-width: 400px;
		text-align: center;
	}

	/* Label Section */
	.label-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		opacity: 0;
		transform: translateY(-30px);
		transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.label-section.show {
		opacity: 1;
		transform: translateY(0);
	}

	.label-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(29, 185, 84, 0.5),
			transparent
		);
		transform: scaleX(0);
		transition: transform 0.8s ease 0.3s;
	}

	.label-section.show .label-line {
		transform: scaleX(1);
	}

	.label-line.left {
		transform-origin: right;
	}
	.label-line.right {
		transform-origin: left;
	}

	.label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.unicode {
		font-family: "JetBrains Mono", monospace;
		color: #1db954;
	}

	/* Poster Section */
	.poster-section {
		position: relative;
		opacity: 0;
		transform: translateY(40px) scale(0.7);
		transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.poster-section.show {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.poster-frame {
		width: 200px;
		max-width: 55vw;
		aspect-ratio: 2/3;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
		position: relative;
		z-index: 1;
	}

	.poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.poster-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.fallback-initial {
		font-size: 5rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.2);
		font-family: "Space Grotesk", sans-serif;
	}

	.fallback-title {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.5rem;
		text-align: center;
		line-height: 1.3;
	}

	.poster-glow {
		position: absolute;
		inset: -40px;
		border-radius: 50px;
		background: radial-gradient(
			circle,
			rgba(29, 185, 84, 0.3) 0%,
			transparent 70%
		);
		z-index: 0;
		opacity: 0;
		animation: none;
	}

	.poster-section.show .poster-glow {
		animation: glowPulse 2s ease-out;
	}

	@keyframes glowPulse {
		0% {
			opacity: 0;
			transform: scale(0.6);
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: scale(1.2);
		}
	}

	/* Title Section */
	.title-section {
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.title-section.show {
		opacity: 1;
		transform: translateY(0);
	}

	.title {
		font-size: clamp(1.75rem, 7vw, 2.75rem);
		font-weight: 700;
		margin: 0;
		line-height: 1.15;
		background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Stats Section */
	.stats-section {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1rem 1.5rem;
		background: rgba(20, 20, 20, 0.85);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.stats-section.show {
		opacity: 1;
		transform: translateY(0);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.375rem;
		font-weight: 600;
		color: white;
	}

	.stat-label {
		font-size: 0.625rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 0.125rem;
	}

	.stat-divider {
		font-family: "JetBrains Mono", monospace;
		color: rgba(255, 255, 255, 0.2);
		font-size: 1.25rem;
	}

	/* Mobile Compression */
	@media (max-width: 480px) {
		.card-base {
			padding: 1.25rem;
		}

		.card-content {
			gap: 1rem;
		}

		.label {
			font-size: 0.75rem;
		}

		.label-section {
			gap: 0.5rem;
		}

		.poster-frame {
			width: 160px;
			max-width: 45vw;
			border-radius: 12px;
		}

		.poster-glow {
			inset: -25px;
		}

		.title {
			font-size: clamp(1.25rem, 6vw, 1.75rem);
		}

		.stats-section {
			gap: 0.75rem;
			padding: 0.75rem 1rem;
			border-radius: 10px;
		}

		.stat-value {
			font-size: 1.125rem;
		}

		.stat-label {
			font-size: 0.5625rem;
		}

		.stat-divider {
			font-size: 1rem;
		}
	}
</style>
