<script lang="ts">
	import type { UserStats } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let stats: UserStats;

	const mediaTypeLabel: Record<string, string> = {
		movie: "Movies",
		episode: "Episodes",
		musicvideo: "Music Videos",
	};
</script>

<div class="card-base" id="rewatch-card">
	<div class="share-container">
		<ShareButton targetId="rewatch-card" fileName="emby-wrapped-rewatch.png" />
	</div>

	<div class="card-content">
		<p class="eyebrow">Rewatch Index</p>
		<h2 class="index-value font-display">{stats.rewatch.rewatchIndex.toFixed(1)}</h2>
		<p class="subtitle">repeat plays per 100 watched items</p>

		<div class="totals font-mono">
			<span>{stats.rewatch.uniqueItemsWatched} unique watched</span>
			<span>◈</span>
			<span>{stats.rewatch.itemsRewatched} rewatched</span>
			<span>◈</span>
			<span>{stats.rewatch.totalRepeatPlays} repeats</span>
		</div>

		{#if stats.rewatch.topRewatchedTitles.length > 0}
			<div class="section">
				<h3>Top Rewatched Titles</h3>
				<ol>
					{#each stats.rewatch.topRewatchedTitles as item}
						<li>
							<span class="name">{item.name}</span>
							<span class="meta font-mono">{item.playCount} plays (+{item.repeatPlays})</span>
						</li>
					{/each}
				</ol>
			</div>
		{/if}

		{#if stats.rewatch.mediaTypeSplit && stats.rewatch.mediaTypeSplit.length > 0}
			<div class="section">
				<h3>By Media Type</h3>
				<ul>
					{#each stats.rewatch.mediaTypeSplit as split}
						<li>
							<span class="name">{mediaTypeLabel[split.mediaType] || split.mediaType}</span>
							<span class="meta font-mono">{split.rewatchIndex.toFixed(1)} index · {split.totalRepeatPlays} repeats</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	.card-base {
		position: relative;
		width: 100%;
		min-height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1.5rem;
	}
	.share-container { position: absolute; top: 1.5rem; right: 1.5rem; z-index: 50; }
	:global(.snapshot-mode) .share-container { display: none !important; }
	.card-content { width: 100%; max-width: 520px; text-align: center; }
	.eyebrow { text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.8; }
	.index-value { font-size: 4rem; margin: 0.2rem 0; }
	.subtitle { margin-top: 0; opacity: 0.75; }
	.totals { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; opacity: 0.9; margin: 1rem 0 1.5rem; }
	.section { text-align: left; margin-top: 1.25rem; }
	h3 { margin: 0 0 0.5rem; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }
	ol, ul { margin: 0; padding-left: 1.25rem; }
	li { display: flex; justify-content: space-between; gap: 1rem; margin: 0.35rem 0; }
	.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.meta { opacity: 0.8; white-space: nowrap; }
</style>
