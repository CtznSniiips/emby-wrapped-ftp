<script lang="ts">
	import { onMount } from 'svelte';
	import AnimatedNumber from '$lib/components/ui/AnimatedNumber.svelte';
	import { UNICODE } from '$lib/utils/format';
	import SeerrLogo from '$lib/assets/seerr-logo.svg';

	export let displayPeriod: string;
	export let seerrRequests: {
		totalRequests: number;
		movieRequests: number;
		seriesRequests: number;
		requestsByUser: Array<{ name: string; count: number; movieRequests: number; seriesRequests: number }>;
	};

	let visible = false;
	let revealBreakdown = false;

	onMount(() => {
		const showCard = setTimeout(() => {
			visible = true;
		}, 100);

		const showBreakdown = setTimeout(() => {
			revealBreakdown = true;
		}, 900);

		return () => {
			clearTimeout(showCard);
			clearTimeout(showBreakdown);
		};
	});
</script>

<div class="card-base" class:visible>
	<div class="card-content seerr-card">
		<img src={SeerrLogo} alt="Seerr logo" class="seerr-logo" />

		<p class="card-label">
			<span class="unicode">{UNICODE.sparkle}</span>
			In {displayPeriod}, our community made
		</p>

		<div class="giant-stat">
			<span class="stat-number font-display">
				<AnimatedNumber value={seerrRequests.totalRequests} duration={2000} />
			</span>
			<span class="stat-unit">REQUESTS</span>
		</div>

		<p class="request-type-breakdown">
			Movies: <span class="font-mono">{seerrRequests.movieRequests}</span>
			&middot;
			Series: <span class="font-mono">{seerrRequests.seriesRequests}</span>
		</p>

		<p class="seerr-breakdown-title" class:show={revealBreakdown}>User breakdown</p>
		<div class="seerr-breakdown" class:show={revealBreakdown}>
			{#each seerrRequests.requestsByUser as userReq, index}
				<div class="seerr-user-row" style={`--row-delay: ${index * 120}ms`}>
					<p class="seerr-row">
						<span>{userReq.name}</span>
						<span class="font-mono">{userReq.count} request{userReq.count === 1 ? '' : 's'}</span>
					</p>
					<p class="seerr-row-subtext">
						Movies: <span class="font-mono">{userReq.movieRequests}</span>
						&middot;
						Series: <span class="font-mono">{userReq.seriesRequests}</span>
					</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.card-base {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		opacity: 0;
		transform: translateY(20px) scale(0.985);
		transition: opacity 0.45s ease, transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.card-base.visible {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
	}

	.seerr-logo {
		width: 120px;
		height: auto;
		opacity: 0.95;
		animation: floatIn 0.7s 0.15s both;
	}

	.card-label {
		font-size: 1rem;
		opacity: 0.9;
		margin: 0;
		animation: fadeUp 0.55s 0.25s both;
	}

	.giant-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 0.75rem;
		animation: popIn 0.6s 0.4s both;
	}

	.stat-number {
		font-size: clamp(3rem, 11vw, 5rem);
		line-height: 0.95;
	}

	.stat-unit {
		letter-spacing: 0.12em;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.request-type-breakdown {
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
		opacity: 0.9;
		animation: fadeUp 0.55s 0.55s both;
	}

	.seerr-card {
		max-width: 520px;
		width: 100%;
		gap: 1rem;
	}

	.seerr-breakdown-title {
		font-size: 0.95rem;
		opacity: 0;
		margin-top: 0.25rem;
		transform: translateY(8px);
		transition: opacity 0.35s ease, transform 0.35s ease;
	}

	.seerr-breakdown-title.show {
		opacity: 0.85;
		transform: translateY(0);
	}

	.seerr-breakdown {
		width: 100%;
		max-width: 420px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 12px;
		padding: 0.8rem 1rem;
		opacity: 0;
		transform: translateY(12px);
		transition: opacity 0.45s ease, transform 0.45s ease;
	}

	.seerr-breakdown.show {
		opacity: 1;
		transform: translateY(0);
	}

	.seerr-user-row {
		padding: 0.3rem 0;
		opacity: 0;
		transform: translateY(6px);
	}

	.seerr-breakdown.show .seerr-user-row {
		animation: fadeUp 0.45s ease both;
		animation-delay: calc(120ms + var(--row-delay));
	}

	.seerr-user-row + .seerr-user-row {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.seerr-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin: 0.1rem 0;
		font-size: 0.95rem;
	}

	.seerr-row-subtext {
		margin: 0;
		text-align: left;
		font-size: 0.82rem;
		opacity: 0.8;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes floatIn {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.96);
		}
		to {
			opacity: 0.95;
			transform: translateY(0) scale(1);
		}
	}
</style>
