<script lang="ts">
	import { onMount } from "svelte";
	import type { MusicStats } from "$lib/server/stats";
	import ShareButton from "../ui/ShareButton.svelte";

	export let music: MusicStats;

	let visible = false;

	onMount(() => {
		setTimeout(() => (visible = true), 100);
	});

	$: topArtist = music.topArtists?.[0];
	$: hours = Math.round(music.totalMinutes / 60);
    // Show top 5 tracks and top 2-5 artists side by side
	$: topTracks = music.topTracks?.slice(0, 5) || [];
	$: otherArtists = (music.topArtists || []).slice(1, 6); // Show top 2-6 artists (5 items)

	let imageErrors = new Set<string>();

	function handleImageError(key: string) {
		imageErrors.add(key);
		imageErrors = imageErrors; // Trigger reactivity
	}
</script>

<div class="card-base" class:visible id="music-summary-card">
	<div class="share-container">
		<ShareButton targetId="music-summary-card" fileName="music-summary.png" />
	</div>

	<div class="content">
		<div class="header">
			<span class="label">Your Music</span>
		</div>

		<div class="time-display">
			<div class="big-number font-display">{hours.toLocaleString()}</div>
			<div class="unit">hours of music</div>
		</div>

		{#if topArtist}
			<div class="top-artist-section">
				<span class="section-label">Top Artist</span>
				<div class="top-artist">
					<div class="artist-icon">
						{#if topArtist.imageUrl && !imageErrors.has('top-artist')}
							<img 
								src={`/api/proxy-image?url=${encodeURIComponent(topArtist.imageUrl)}`} 
								alt={topArtist.name} 
								on:error={() => handleImageError('top-artist')}
							/>
						{:else}
							<span>{topArtist.name.charAt(0).toUpperCase()}</span>
						{/if}
					</div>
					<div class="artist-info">
						<span class="artist-name">{topArtist.name}</span>
						<span class="artist-stats">{Math.round(topArtist.minutes)} min · {topArtist.count} plays</span>
					</div>
				</div>
			</div>

            <div class="lists-container">
                {#if otherArtists.length > 0}
                    <div class="list-column">
                        <span class="section-label">Top Artists</span>
                        <div class="compact-list">
                            {#each otherArtists as artist, i}
                                <div class="compact-item">
                                    <span class="rank">#{i + 2}</span>
                                    <div class="item-thumb">
                                        {#if artist.imageUrl && !imageErrors.has(`artist-${i}`)}
                                            <img 
                                                src={`/api/proxy-image?url=${encodeURIComponent(artist.imageUrl)}`} 
                                                alt={artist.name} 
                                                on:error={() => handleImageError(`artist-${i}`)}
                                            />
                                        {:else}
                                            <div class="thumb-placeholder">{artist.name.charAt(0)}</div>
                                        {/if}
                                    </div>
                                    <div class="info">
                                        <span class="name">{artist.name}</span>
                                        <span class="sub">{Math.round(artist.minutes)}m</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if topTracks.length > 0}
                    <div class="list-column">
                        <span class="section-label">Top Songs</span>
                        <div class="compact-list">
                            {#each topTracks as track, i}
                                <div class="compact-item">
                                    <span class="rank">#{i + 1}</span>
                                    <div class="item-thumb track">
                                        {#if track.imageUrl && !imageErrors.has(`track-${i}`)}
                                            <img 
                                                src={`/api/proxy-image?url=${encodeURIComponent(track.imageUrl)}`} 
                                                alt={track.name} 
                                                on:error={() => handleImageError(`track-${i}`)}
                                            />
                                        {:else}
                                            <div class="thumb-placeholder">{track.name.charAt(0)}</div>
                                        {/if}
                                    </div>
                                    <div class="info">
                                        <span class="name">{track.name}</span>
                                        <span class="sub">{track.count}p · {track.artist}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
		{/if}
	</div>
</div>

<style>
    /* ... existing styles ... */
    .lists-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        width: 100%;
        margin-top: 0.5rem;
    }
    .list-column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 0; /* Enable truncation in grid item */
    }
    .compact-list {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }
    .compact-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.5rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 0.5rem;
        font-size: 0.8rem;
        height: 54px; /* Increased height for larger thumbnails */
    }
    .compact-item .rank {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: #ec4899;
        width: 1.2rem;
        flex-shrink: 0;
    }
    .item-thumb {
        width: 40px; /* Increased from 28px */
        height: 40px; /* Increased from 28px */
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .item-thumb.track {
        border-radius: 4px;
    }
    .item-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6rem;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.7);
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        text-transform: uppercase;
    }
    .compact-item .info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        justify-content: center;
    }
    .compact-item .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.9);
    }
    .compact-item .sub {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
	.card-base {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		opacity: 0;
		transition: opacity 0.8s ease;
		background: radial-gradient(
			circle at 50% 30%,
			rgba(139, 92, 246, 0.15) 0%,
			transparent 60%
		);
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

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem; /* Reduced gap */
		padding: 1.5rem; /* Reduced padding */
		text-align: center;
		width: 100%;
		max-width: 500px; /* Increased max-width for side-by-side */
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-family: "JetBrains Mono", monospace;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.time-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.big-number {
		font-size: 4rem; /* Slightly smaller */
		font-weight: 800;
		line-height: 0.9;
		background: linear-gradient(180deg, #8b5cf6 0%, #ec4899 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 0 80px rgba(139, 92, 246, 0.4);
	}

	.unit {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.stats-row {
        display: none; /* Hide redundant stats row to save space */
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.top-artist-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.section-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.1em;
        text-align: center;
	}

	.top-artist {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		width: 100%;
	}

	.artist-icon {
		width: 64px; /* Increased from 40px */
		height: 64px; /* Increased from 40px */
		border-radius: 50%;
		background: linear-gradient(135deg, #8b5cf6, #ec4899);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem; /* Larger font for fallback */
		font-weight: 700;
		color: white;
		flex-shrink: 0;
		overflow: hidden;
	}

	.artist-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.artist-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
        overflow: hidden;
	}

	.artist-name {
		font-size: 1rem;
		font-weight: 600;
		color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
	}

	.artist-stats {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.other-artists {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.artist-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
	}

	.rank {
		font-family: "JetBrains Mono", monospace;
		font-size: 0.7rem;
		color: #ec4899;
		width: 1.5rem;
	}

	.name {
		flex: 1;
		text-align: left;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.time {
		font-family: "JetBrains Mono", monospace;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
	}
</style>
