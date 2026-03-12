<script lang="ts">
	import { onMount } from "svelte";
	import { UNICODE, formatMonthShort } from "$lib/utils/format";
	import type { UserStats } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let stats: UserStats;

	let visible = false;
	let phase = 0; // 0=hidden, 1=title, 2=chart, 3=peak month, 4=insight

	onMount(() => {
		setTimeout(() => {
			visible = true;
			startNarrative();
		}, 100);
	});

	function startNarrative() {
		const timeline = [
			{ phase: 1, delay: 0 }, // Title
			{ phase: 2, delay: 400 }, // Chart bars start animating
			{ phase: 3, delay: 2000 }, // Peak month
			{ phase: 4, delay: 2600 }, // Insight
		];
		timeline.forEach(({ phase: p, delay }) => {
			setTimeout(() => {
				phase = p;
			}, delay);
		});
	}

	$: maxMonth = Math.max(...stats.heatmap.months);
	$: peakMonth = stats.heatmap.months.indexOf(maxMonth);

	function getMonthHeight(value: number): number {
		return maxMonth > 0 ? (value / maxMonth) * 100 : 0;
	}

	function getMonthInsight(): string {
		const monthName = formatMonthShort(peakMonth);
		const hours = Math.round(stats.heatmap.months[peakMonth] / 60);
		return `${monthName} was your top streaming month with ${hours} hours`;
	}
</script>

<div class="card-base" class:visible id="monthly-card">
	<div class="share-container">
		<ShareButton
			targetId="monthly-card"
			fileName="emby-wrapped-monthly.png"
		/>
	</div>

	<div class="card-content">
		<!-- Title -->
		<div class="title-section" class:show={phase >= 1}>
			<span class="unicode">{UNICODE.triangleUp}</span>
			<h2 class="section-title font-display">Your Year in Motion</h2>
		</div>

		<!-- Monthly chart -->
		<div class="chart-container" class:show={phase >= 2}>
			<div class="chart">
				{#each stats.heatmap.months as value, i}
					<div class="month-col">
						<div
							class="bar"
							class:animate={phase >= 2}
							class:peak={i === peakMonth}
							style="--target-height: {getMonthHeight(
								value,
							)}%; --delay: {i * 60}ms"
						>
							{#if value > 0}
								<span class="bar-value font-mono"
									>{Math.round(value / 60)}</span
								>
							{/if}
						</div>
						<span class="month-label">{formatMonthShort(i)}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Peak month highlight -->
		<div class="peak-month" class:show={phase >= 3}>
			<span class="peak-label">Peak month</span>
			<span class="peak-name font-display"
				>{formatMonthShort(peakMonth)}</span
			>
		</div>

		<!-- Insight -->
		<div class="insight" class:show={phase >= 4}>
			<span class="insight-icon">{UNICODE.sparkle}</span>
			<p>{getMonthInsight()}</p>
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
		gap: 1.5rem;
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
		color: #1db954;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		margin: 0;
	}

	/* Chart */
	.chart-container {
		width: 100%;
		padding: 1rem 0.5rem;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.chart-container.show {
		opacity: 1;
		transform: translateY(0);
	}

	.chart {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 140px;
		gap: 4px;
	}

	.month-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.bar {
		width: 100%;
		max-width: 24px;
		height: 0%;
		background: linear-gradient(to top, #1db954, #3b82f6);
		border-radius: 4px 4px 0 0;
		margin-top: auto;
		position: relative;
		transition: height 0.8s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: var(--delay, 0ms);
		min-height: 4px;
	}

	.bar.animate {
		height: var(--target-height);
	}

	.bar.peak {
		background: linear-gradient(to top, #f97316, #ef4444);
		box-shadow: 0 0 12px rgba(249, 115, 22, 0.4);
	}

	.bar-value {
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.5rem;
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
	}

	.month-label {
		font-size: 0.5rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.375rem;
		text-transform: uppercase;
	}

	/* Peak month */
	.peak-month {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.peak-month.show {
		opacity: 1;
		transform: scale(1);
	}

	.peak-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.peak-name {
		font-size: 2rem;
		font-weight: 700;
		background: linear-gradient(135deg, #f97316, #ef4444);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Insight */
	.insight {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: rgba(249, 115, 22, 0.1);
		border-radius: 10px;
		border: 1px solid rgba(249, 115, 22, 0.2);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease;
	}

	.insight.show {
		opacity: 1;
		transform: translateY(0);
	}

	.insight-icon {
		font-family: "JetBrains Mono", monospace;
		color: #f97316;
	}

	.insight p {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
		font-style: italic;
	}
</style>
