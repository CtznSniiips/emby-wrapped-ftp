<script lang="ts">
	import { onMount } from "svelte";
	import {
		UNICODE,
		formatDayShort,
		getDayPersonality,
	} from "$lib/utils/format";
	import type { UserStats } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let stats: UserStats;

	let visible = false;
	let phase = 0; // 0=hidden, 1=title, 2=chart, 3=personality

	onMount(() => {
		setTimeout(() => {
			visible = true;
			startNarrative();
		}, 100);
	});

	function startNarrative() {
		const timeline = [
			{ phase: 1, delay: 0 }, // Title
			{ phase: 2, delay: 500 }, // Chart bars animate
			{ phase: 3, delay: 2200 }, // Personality badge
		];
		timeline.forEach(({ phase: p, delay }) => {
			setTimeout(() => {
				phase = p;
			}, delay);
		});
	}

	$: maxDay = Math.max(...stats.heatmap.days);
	$: personality = getDayPersonality(stats.peakDay);

	function getDayHeight(value: number): number {
		return maxDay > 0 ? (value / maxDay) * 100 : 0;
	}

	function getDayColor(dayIndex: number): string {
		if (dayIndex === 0 || dayIndex === 6) {
			return "weekend";
		}
		return "weekday";
	}

	function getDayHours(value: number): number {
		return Math.round(value / 60);
	}
</script>

<div class="card-base" class:visible id="dayofweek-card">
	<div class="share-container">
		<ShareButton
			targetId="dayofweek-card"
			fileName="emby-wrapped-week.png"
		/>
	</div>

	<div class="card-content">
		<!-- Title -->
		<div class="title-section" class:show={phase >= 1}>
			<span class="unicode">{UNICODE.sparkle}</span>
			<h2 class="section-title font-display">Your Week in Review</h2>
		</div>

		<!-- Chart -->
		<div class="chart-wrapper" class:show={phase >= 2}>
			<div class="chart">
				{#each stats.heatmap.days as value, i}
					<div class="day-column">
						<div class="bar-area">
							<span
								class="bar-value font-mono"
								class:visible={phase >= 2}
							>
								{getDayHours(value)}h
							</span>
							<div
								class="bar {getDayColor(i)}"
								class:animate={phase >= 2}
								class:peak={i === stats.peakDay}
								style="--target-height: {getDayHeight(
									value,
								)}%; --delay: {i * 80}ms"
							></div>
						</div>
						<span
							class="day-label"
							class:peak={i === stats.peakDay}
						>
							{formatDayShort(i)}
						</span>
					</div>
				{/each}
			</div>

			<!-- Legend -->
			<div class="legend">
				<div class="legend-item">
					<span class="legend-dot weekday"></span>
					<span>Weekdays</span>
				</div>
				<div class="legend-item">
					<span class="legend-dot weekend"></span>
					<span>Weekends</span>
				</div>
			</div>
		</div>

		<!-- Personality Badge -->
		<div class="personality-badge" class:show={phase >= 3}>
			<span class="badge-label">You're a</span>
			<h3 class="badge-title font-display">{personality.label}</h3>
			<p class="badge-tagline">{personality.tagline}</p>
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
		padding: 2rem 1rem;
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.card-base.visible {
		opacity: 1;
	}

	.share-container {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 50;
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
		gap: 2rem;
		width: 100%;
		max-width: 400px;
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
		color: #7c3aed;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		margin: 0;
	}

	/* Chart */
	.chart-wrapper {
		width: 100%;
		padding: 1.5rem;
		background: rgba(20, 20, 20, 0.6);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.chart-wrapper.show {
		opacity: 1;
		transform: translateY(0);
	}

	.chart {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 140px;
		gap: 8px;
		margin-bottom: 1rem;
	}

	.day-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.bar-area {
		flex: 1;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		position: relative;
	}

	.bar-value {
		font-size: 0.625rem;
		color: rgba(255, 255, 255, 0.4);
		margin-bottom: 0.25rem;
		opacity: 0;
		transition: opacity 0.3s ease 1.5s;
	}

	.bar-value.visible {
		opacity: 1;
	}

	.bar {
		width: 100%;
		max-width: 36px;
		height: 0%;
		border-radius: 6px 6px 2px 2px;
		min-height: 4px;
		transition: height 0.8s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: var(--delay, 0ms);
	}

	.bar.animate {
		height: var(--target-height);
	}

	.bar.weekday {
		background: linear-gradient(to top, #1db954, #22d3ee);
	}

	.bar.weekend {
		background: linear-gradient(to top, #7c3aed, #a855f7);
	}

	.bar.peak {
		box-shadow: 0 0 16px rgba(124, 58, 237, 0.5);
	}

	.day-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.5rem;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.day-label.peak {
		color: #7c3aed;
		font-weight: 600;
	}

	/* Legend */
	.legend {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}

	.legend-dot.weekday {
		background: linear-gradient(135deg, #1db954, #22d3ee);
	}

	.legend-dot.weekend {
		background: linear-gradient(135deg, #7c3aed, #a855f7);
	}

	/* Personality Badge */
	.personality-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 1.25rem 2rem;
		background: linear-gradient(
			135deg,
			rgba(124, 58, 237, 0.15) 0%,
			rgba(29, 185, 84, 0.15) 100%
		);
		border-radius: 16px;
		border: 1px solid rgba(124, 58, 237, 0.25);
		opacity: 0;
		transform: scale(0.9);
		transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.personality-badge.show {
		opacity: 1;
		transform: scale(1);
	}

	.badge-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.badge-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: white;
		margin: 0;
		background: linear-gradient(135deg, #7c3aed 0%, #1db954 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.badge-tagline {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
		font-style: italic;
	}
</style>
