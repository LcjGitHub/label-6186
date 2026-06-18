<script>
  import { createQuery } from '@tanstack/svelte-query';
  import { Alert, Spinner } from 'flowbite-svelte';
  import {
    ArchiveOutline,
    ImageOutline,
  } from 'flowbite-svelte-icons';
  import { fetchStats } from '../lib/stats.js';

  const statsQuery = createQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  $: totalFolders = $statsQuery.data?.total_folders ?? 0;
  $: totalSlides = $statsQuery.data?.total_slides ?? 0;
  $: eraDistribution = $statsQuery.data?.era_distribution ?? [];

  $: totalEraCount = eraDistribution.reduce((sum, item) => sum + item.count, 0);
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">统计看板</h1>
    <p class="mt-1 text-sm text-gray-500">全局数据概览与年代分布</p>
  </div>

  {#if $statsQuery.isLoading}
    <div class="flex justify-center py-16">
      <Spinner size="8" />
    </div>
  {:else if $statsQuery.isError}
    <Alert color="red">加载失败，请确认后端已启动（端口 8000）</Alert>
  {:else}
    <div class="grid gap-4 md:grid-cols-2">
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
          >
            <ArchiveOutline class="h-6 w-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-500">片夹总数量</p>
            <p class="mt-1 text-3xl font-bold text-gray-900">{totalFolders}</p>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"
          >
            <ImageOutline class="h-6 w-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-500">单张总数量</p>
            <p class="mt-1 text-3xl font-bold text-gray-900">{totalSlides}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">按年代汇总的片夹数量分布</h2>

      {#if eraDistribution.length === 0}
        <Alert color="yellow">暂无年代数据</Alert>
      {:else}
        <ul class="space-y-3">
          {#each eraDistribution as item (item.era)}
            <li class="flex items-center gap-4">
              <span class="w-28 shrink-0 text-sm font-medium text-gray-700">{item.era}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">{item.count} 个片夹</span>
                  <span class="text-gray-400">
                    {totalEraCount > 0
                      ? ((item.count / totalEraCount) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    class="h-full rounded-full bg-blue-500 transition-all"
                    style="width: {totalEraCount > 0
                      ? (item.count / totalEraCount) * 100
                      : 0}%;"
                  ></div>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
