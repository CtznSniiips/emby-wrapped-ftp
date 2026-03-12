<script lang="ts">
	import { onMount } from "svelte";
	import {
		UNICODE,
		formatHour,
		getViewingPersonality,
	} from "$lib/utils/format";
	import type { UserStats } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let stats: UserStats;

	let visible = false;
	let phase = 0; // 0=hidden, 1=title, 2=clock, 3=peak info, 4=personality

	onMount(() => {
		setTimeout(() => {
			visible = true;
			startNarrative();
		}, 100);
	});

	function startNarrative() {
		const timeline = [
			{ phase: 1, delay: 0 }, // Title
			{ phase: 2, delay: 600 }, // Clock appears
			{ phase: 3, delay: 2200 }, // Peak info (slower)
			{ phase: 4, delay: 3000 }, // Personality badge
		];
		timeline.forEach(({ phase: p, delay }) => {
			setTimeout(() => {
				phase = p;
			}, delay);
		});
	}

	$: personality = getViewingPersonality(stats);
	$: maxHour = Math.max(...stats.heatmap.hours);

	function getHourIntensity(hour: number): number {
		return maxHour > 0 ? stats.heatmap.hours[hour] / maxHour : 0;
	}

	$: peakStart = stats.peakHour;
	$: peakEnd = (stats.peakHour + 2) % 24;
</script>

<div class="card-base" class:visible id="clock-card">
	<div class="share-container">
		<ShareButton targetId="clock-card" fileName="emby-wrapped-clock.png" />
	</div>

	<div class="card-content">
		<!-- Title -->
		<div class="title-section" class:show={phase >= 1}>
			<span class="unicode">{UNICODE.halfMoonLeft}</span>
			<h2 class="section-title font-display">Your Watching Hours</h2>
		</div>

		<!-- Clock visualization -->
		<div class="clock-container" class:show={phase >= 2}>
			<svg viewBox="0 0 200 200" class="clock">
				<!-- Clock background -->
				<circle
					cx="100"
					cy="100"
					r="90"
					fill="rgba(20, 20, 20, 0.6)"
					stroke="rgba(255,255,255,0.1)"
					stroke-width="1"
				/>

				<!-- Hour segments -->
				{#each Array(24) as _, i}
					{@const angle = (i / 24) * 360 - 90}
					{@const intensity = getHourIntensity(i)}
					{@const innerRadius = 35}
					{@const outerRadius = 35 + intensity * 45}
					{@const startAngle = (angle - 7) * (Math.PI / 180)}
					{@const endAngle = (angle + 7) * (Math.PI / 180)}
					{@const x1 = 100 + innerRadius * Math.cos(startAngle)}
					{@const y1 = 100 + innerRadius * Math.sin(startAngle)}
					{@const x2 = 100 + outerRadius * Math.cos(startAngle)}
					{@const y2 = 100 + outerRadius * Math.sin(startAngle)}
					{@const x3 = 100 + outerRadius * Math.cos(endAngle)}
					{@const y3 = 100 + outerRadius * Math.sin(endAngle)}
					{@const x4 = 100 + innerRadius * Math.cos(endAngle)}
					{@const y4 = 100 + innerRadius * Math.sin(endAngle)}

					<path
						d="M{x1},{y1} L{x2},{y2} L{x3},{y3} L{x4},{y4} Z"
						fill="rgba(29, 185, 84, {0.2 + intensity * 0.8})"
						class="segment"
						class:animate={phase >= 2}
						style="--delay: {i * 40}ms"
					/>
				{/each}

				<!-- Hour markers -->
				{#each [0, 6, 12, 18] as hour}
					{@const angle = (hour / 24) * 360 - 90}
					{@const x = 100 + 82 * Math.cos((angle * Math.PI) / 180)}
					{@const y = 100 + 82 * Math.sin((angle * Math.PI) / 180)}
					<text
						{x}
						{y}
						text-anchor="middle"
						dominant-baseline="middle"
						class="hour-label"
					>
						{hour === 0
							? "12a"
							: hour === 12
								? "12p"
								: hour === 6
									? "6a"
									: "6p"}
					</text>
				{/each}

				<!-- Center circle -->
				<circle
					cx="100"
					cy="100"
					r="28"
					fill="rgba(10, 10, 10, 0.9)"
					stroke="rgba(255,255,255,0.1)"
					stroke-width="1"
				/>
				<text
					x="100"
					y="100"
					text-anchor="middle"
					dominant-baseline="middle"
					class="center-text"
				>
					{formatHour(stats.peakHour)}
				</text>
			</svg>
		</div>

		<!-- Peak time info -->
		<div class="peak-info" class:show={phase >= 3}>
			<p class="peak-label">Peak viewing time</p>
			<p class="peak-time font-mono">
				{formatHour(peakStart)} — {formatHour(peakEnd)}
			</p>
		</div>

		<!-- Personality badge -->
		<div class="personality" class:show={phase >= 4}>
			<span class="personality-unicode">{personality.unicode}</span>
			<span class="personality-label">{personality.label}</span>
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
		gap: 1.5rem;
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

	/* Clock */
	.clock-container {
		width: 260px;
		max-width: 70vw;
		aspect-ratio: 1;
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.clock-container.show {
		opacity: 1;
		transform: scale(1);
	}

	.clock {
		width: 100%;
		height: 100%;
	}

	.segment {
		opacity: 0;
		transform-origin: center;
		transition: opacity 0.3s ease;
		transition-delay: var(--delay, 0ms);
	}

	.segment.animate {
		opacity: 1;
	}

	.hour-label {
		font-family: "JetBrains Mono", monospace;
		font-size: 8px;
		fill: rgba(255, 255, 255, 0.4);
	}

	.center-text {
		font-family: "Space Grotesk", sans-serif;
		font-size: 12px;
		font-weight: 600;
		fill: white;
	}

	/* Peak info */
	.peak-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.peak-info.show {
		opacity: 1;
		transform: translateY(0);
	}

	.peak-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.peak-time {
		font-size: 1.25rem;
		font-weight: 600;
		color: white;
		margin: 0;
	}

	/* Personality */
	.personality {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: rgba(124, 58, 237, 0.15);
		border-radius: 10px;
		border: 1px solid rgba(124, 58, 237, 0.3);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.personality.show {
		opacity: 1;
		transform: translateY(0);
	}

	.personality-unicode {
		font-family: "JetBrains Mono", monospace;
		font-size: 1.25rem;
		color: #7c3aed;
	}

	.personality-label {
		font-size: 1rem;
		font-weight: 500;
		color: white;
	}
</style>
