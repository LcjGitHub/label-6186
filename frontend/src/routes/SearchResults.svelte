<script>
  import { createQuery } from '@tanstack/svelte-query';
  import { Alert, Spinner, Badge } from 'flowbite-svelte';
  import { FolderOutline, FileOutline } from 'flowbite-svelte-icons';
  import { search } from '../lib/folders.js';

  /**
   * @typedef {{
   *   keyword: string,
   *   onselectfolder: (id: number) => void,
   *   onselectslide: (folderId: number, slideId: number) => void
   * }} Props
   */

  /** @type {Props} */
  let { keyword, onselectfolder, onselectslide } = $props();

  let searchKeyword = $derived(keyword);

  const searchQuery = createQuery({
    queryKey: () => ['search', $searchKeyword],
    queryFn: () => search($searchKeyword),
    enabled: () => !!$searchKeyword,
  });

  /**
   * 高亮搜索关键词
   * @param {string} text
   * @param {string} kw
   * @returns {string}
   */
  function highlight(text, kw) {
    if (!kw) return text;
    const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
  }

  $effect(() => {
    if ($searchKeyword) {
      $searchQuery.refetch();
    }
  });

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} event
   * @param {() => void} handler
   */
  function handleKeydown(event, handler) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">
      搜索结果：<span class="text-blue-600">"{keyword}"</span>
    </h1>
    {#if $searchQuery.isSuccess && $searchQuery.data}
      <span class="text-sm text-gray-500">
        共找到 {$searchQuery.data.total} 条结果
      </span>
    {/if}
  </div>

  {#if $searchQuery.isLoading}
    <div class="flex justify-center py-16">
      <Spinner size="8" />
    </div>
  {:else if $searchQuery.isError}
    <Alert color="red">
      搜索失败：{$searchQuery.error?.response?.data?.error || '未知错误'}
    </Alert>
  {:else if $searchQuery.isSuccess && $searchQuery.data}
    {@const result = $searchQuery.data}

    <section class="space-y-4">
      <div class="flex items-center gap-2">
        <FolderOutline class="h-5 w-5 text-blue-600" />
        <h2 class="text-lg font-semibold text-gray-900">
          匹配的片夹
          <Badge color="blue" size="xs" class="ml-2">{result.folders.length}</Badge>
        </h2>
      </div>

      {#if result.folders.length === 0}
        <p class="text-sm text-gray-500 pl-7">暂无匹配的片夹</p>
      {:else}
        <div class="grid gap-3 pl-7">
          {#each result.folders as folder (folder.id)}
            <div
              role="button"
              tabindex="0"
              class="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onclick={() => onselectfolder(folder.id)}
              onkeydown={(e) => handleKeydown(e, () => onselectfolder(folder.id))}
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="font-medium text-gray-900">
                      {@html highlight(folder.theme, keyword)}
                    </h3>
                    <Badge color="blue" size="xs">{folder.code}</Badge>
                  </div>
                  <div class="mt-1 text-sm text-gray-500">
                    {folder.era} · {folder.slide_count} 张
                    {#if folder.category}
                      · <span class="inline-flex items-center gap-1">
                          <span
                            class="h-2.5 w-2.5 rounded-full border border-gray-300"
                            style="background-color: {folder.category.color}"
                          ></span>
                          {folder.category.name}
                        </span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="space-y-4">
      <div class="flex items-center gap-2">
        <FileOutline class="h-5 w-5 text-green-600" />
        <h2 class="text-lg font-semibold text-gray-900">
          匹配的单张
          <Badge color="green" size="xs" class="ml-2">{result.slides.length}</Badge>
        </h2>
      </div>

      {#if result.slides.length === 0}
        <p class="text-sm text-gray-500 pl-7">暂无匹配的单张</p>
      {:else}
        <div class="grid gap-3 pl-7">
          {#each result.slides as slide (slide.id)}
            <div
              role="button"
              tabindex="0"
              class="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
              onclick={() => onselectslide(slide.folder_id, slide.id)}
              onkeydown={(e) => handleKeydown(e, () => onselectslide(slide.folder_id, slide.id))}
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <Badge color="green" size="xs">第 {slide.sequence} 张</Badge>
                    <span class="text-sm text-gray-500">
                      所属片夹：{slide.folder?.theme}（{slide.folder?.code}）
                    </span>
                  </div>
                  <p class="mt-2 text-gray-700 leading-relaxed">
                    {@html highlight(slide.description, keyword)}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    {#if result.total === 0}
      <div class="py-12 text-center">
        <FileOutline class="mx-auto h-12 w-12 text-gray-300" />
        <p class="mt-4 text-gray-500">没有找到与 "{keyword}" 相关的内容</p>
        <p class="mt-1 text-sm text-gray-400">请尝试其他关键词</p>
      </div>
    {/if}
  {/if}
</div>
