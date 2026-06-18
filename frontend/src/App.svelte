<script>
  import FolderList from './routes/FolderList.svelte';
  import FolderDetail from './routes/FolderDetail.svelte';

  /** @type {'list' | 'detail'} */
  let view = $state('list');
  /** @type {number | null} */
  let selectedId = $state(null);

  /**
   * 进入片夹详情
   * @param {number} id
   */
  function openDetail(id) {
    selectedId = id;
    view = 'detail';
  }

  function backToList() {
    view = 'list';
    selectedId = null;
  }
</script>

<div class="min-h-screen">
  <nav class="border-b border-gray-200 bg-white shadow-sm">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <button
        type="button"
        class="text-xl font-semibold text-gray-900 hover:text-blue-600"
        onclick={backToList}
      >
        幻灯片片夹管理
      </button>
      <span class="text-sm text-gray-500">MVP · 片夹与单张描述</span>
    </div>
  </nav>

  <main class="mx-auto max-w-6xl px-4 py-6">
    {#if view === 'list'}
      <FolderList onselect={openDetail} />
    {:else if selectedId}
      <FolderDetail folderId={selectedId} onback={backToList} />
    {/if}
  </main>
</div>
