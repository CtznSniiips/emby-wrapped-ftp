<script lang="ts">
	import { onMount } from "svelte";
	import { UNICODE } from "$lib/utils/format";
	import type { GenreStat } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let genres: GenreStat[];

	let visible = false;
	let phase = 0; // 0=hidden, 1=title, 2=top genre, 3-6=other genres, 7=personality

	onMount(() => {
		setTimeout(() => {
			visible = true;
			startNarrative();
		}, 100);
	});

	function startNarrative() {
		const numGenres = Math.min(genres.length, 5);
		// Dramatic reveal: title → top genre (hero) → other genres cascade → personality
		let delay = 0;
		const timeline: { phase: number; delay: number }[] = [];

		timeline.push({ phase: 1, delay: 0 }); // Title
		timeline.push({ phase: 2, delay: 500 }); // Top genre (featured)

		// Other genres cascade in
		for (let i = 1; i < numGenres; i++) {
			timeline.push({ phase: 2 + i, delay: 1100 + (i - 1) * 200 });
		}

		// Personality
		timeline.push({ phase: 10, delay: 1100 + (numGenres - 1) * 200 + 600 });

		timeline.forEach(({ phase: p, delay }) => {
			setTimeout(() => {
				phase = p;
			}, delay);
		});
	}

	$: displayGenres = genres.slice(0, 5);
	$: topGenre = genres[0];
	$: primaryGenre = genres[0]?.name || "Eclectic";
	$: secondaryGenre = genres[1]?.name || null;

	function getPersonality(): string {
		const numGenres = genres.length;
		const topPercent = genres[0]?.percentage || 0;
		const top = primaryGenre;
		const second = secondaryGenre;

		// Genre-specific titles
		const genreTitles: Record<string, string> = {
			Comedy: "The Laugh Seeker",
			Drama: "The Emotional Voyager",
			Action: "The Adrenaline Junkie",
			Thriller: "The Edge Dweller",
			Horror: "The Fear Connoisseur",
			"Sci-Fi": "The Frontier Explorer",
			Fantasy: "The Dream Weaver",
			Documentary: "The Truth Seeker",
			Romance: "The Heart Follower",
			Animation: "The Artful Eye",
			Crime: "The Case Cracker",
			Mystery: "The Puzzle Master",
			Adventure: "The Thrill Chaser",
			Family: "The Heartwarmer",
			War: "The History Witness",
			Western: "The Frontier Spirit",
			Musical: "The Melody Lover",
			"Science Fiction": "The Frontier Explorer",
		};

		const title = genreTitles[top] || `The ${top} Fan`;

		// Tagline based on viewing distribution
		if (topPercent > 60) {
			return `${title} - unshakably devoted`;
		}
		if (topPercent > 45) {
			return `${title} - with clear conviction`;
		}
		if (topPercent > 30) {
			if (second) {
				return `${title} - with a ${second} streak`;
			}
			return `${title} - leading the pack`;
		}
		if (topPercent > 20) {
			if (numGenres >= 5) {
				return `${title} - among many passions`;
			}
			return `${title} - first among equals`;
		}

		// Very balanced viewing - still use top genre but acknowledge breadth
		if (numGenres >= 6) {
			return `${title} - curator of all genres`;
		}

		return `${title} - with eclectic taste`;
	}

	function getGenreColor(index: number): string {
		const colors = ["#1db954", "#22d3ee", "#7c3aed", "#f97316", "#ef4444"];
		return colors[index % colors.length];
	}
</script>

<div class="card-base" class:visible id="genre-card">
	<div class="share-container">
		<ShareButton targetId="genre-card" fileName="emby-wrapped-genres.png" />
	</div>

	<div class="card-content">
		<!-- Title -->
		<div class="title-section" class:show={phase >= 1}>
			<span class="unicode">{UNICODE.sparkle}</span>
			<h2 class="section-title font-display">Your Taste</h2>
		</div>

		<!-- Top Genre - Hero section -->
		{#if topGenre}
			<div class="hero-genre" class:show={phase >= 2}>
				<div
					class="hero-ring"
					class:animate={phase >= 2}
					style="--color: {getGenreColor(
						0,
					)}; --percent: {topGenre.percentage}"
				>
					<div class="hero-inner">
						<span class="hero-percent font-mono"
							>{topGenre.percentage}%</span
						>
					</div>
				</div>
				<h3 class="hero-name font-display">{topGenre.name}</h3>
				<p class="hero-subtitle">Your #1 Genre</p>
			</div>
		{/if}

		<!-- Other genres -->
		<div class="genre-list">
			{#each displayGenres.slice(1) as genre, i}
				<div class="genre-row" class:show={phase >= 3 + i}>
					<div class="genre-rank font-mono">#{i + 2}</div>
					<div class="genre-bar-wrap">
						<div
							class="genre-bar"
							class:animate={phase >= 3 + i}
							style="--target-width: {genre.percentage}%; --color: {getGenreColor(
								i + 1,
							)}"
						></div>
					</div>
					<span class="genre-name">{genre.name}</span>
					<span class="genre-percent font-mono"
						>{genre.percentage}%</span
					>
				</div>
			{/each}
		</div>

		<!-- Personality -->
		<div class="personality" class:show={phase >= 10}>
			<span class="personality-icon">{UNICODE.asterism}</span>
			<p>{getPersonality()}</p>
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
		padding: 2rem 1.5rem;
		opacity: 0;
		transition: opacity 0.4s ease;
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

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.75rem;
		width: 100%;
		max-width: 360px;
	}

	/* Title */
	.title-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		opacity: 0;
		transform: translateY(-20px);
		transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.title-section.show {
		opacity: 1;
		transform: translateY(0);
	}

	.unicode {
		font-family: "JetBrains Mono", monospace;
		font-size: 1.25rem;
		color: #1db954;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		margin: 0;
	}

	/* Hero Genre */
	.hero-genre {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.hero-genre.show {
		opacity: 1;
		transform: scale(1);
	}

	.hero-ring {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: conic-gradient(
			var(--color) 0deg,
			var(--color) 0deg,
			rgba(255, 255, 255, 0.1) 0deg
		);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 40px rgba(29, 185, 84, 0.3);
		transition: background 1s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.hero-ring.animate {
		background: conic-gradient(
			var(--color) 0deg,
			var(--color) calc(var(--percent) * 3.6deg),
			rgba(255, 255, 255, 0.1) calc(var(--percent) * 3.6deg)
		);
	}

	.hero-inner {
		width: 90px;
		height: 90px;
		border-radius: 50%;
		background: #0a0a0a;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-percent {
		font-size: 1.75rem;
		font-weight: 700;
		color: white;
	}

	.hero-name {
		font-size: 1.75rem;
		font-weight: 700;
		color: white;
		margin: 0;
		text-align: center;
	}

	.hero-subtitle {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		margin: 0;
	}

	/* Genre List */
	.genre-list {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.genre-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		opacity: 0;
		transform: translateX(-20px);
		transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.genre-row.show {
		opacity: 1;
		transform: translateX(0);
	}

	.genre-rank {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		width: 24px;
	}

	.genre-bar-wrap {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.genre-bar {
		height: 100%;
		width: 0%;
		background: var(--color);
		border-radius: 3px;
		transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.genre-bar.animate {
		width: var(--target-width);
	}

	.genre-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		min-width: 80px;
	}

	.genre-percent {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		width: 36px;
		text-align: right;
	}

	/* Personality */
	.personality {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 10px;
		border: 1px solid rgba(124, 58, 237, 0.2);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.personality.show {
		opacity: 1;
		transform: translateY(0);
	}

	.personality-icon {
		font-family: "JetBrains Mono", monospace;
		color: rgba(255, 255, 255, 0.3);
	}

	.personality p {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
		font-style: italic;
	}
</style>
