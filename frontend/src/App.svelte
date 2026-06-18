<script>
  import FolderList from './routes/FolderList.svelte';
  import FolderDetail from './routes/FolderDetail.svelte';
  import CategoryList from './routes/CategoryList.svelte';
  import BorrowList from './routes/BorrowList.svelte';

  /** @type {'folders' | 'detail' | 'categories' | 'borrows'} */
  let view = $state('folders');
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

  function goToFolders() {
    view = 'folders';
    selectedId = null;
  }

  function goToCategories() {
    view = 'categories';
    selectedId = null;
  }

  function goToBorrows() {
    view = 'borrows';
    selectedId = null;
  }
</script>

<div class="min-h-screen">
  <nav class="border-b border-gray-200 bg-white shadow-sm">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <div class="flex items-center gap-6">
        <button
          type="button"
          class="text-xl font-semibold text-gray-900 hover:text-blue-600"
          onclick={goToFolders}
        >
          幻灯片片夹管理
        </button>
        <div class="flex gap-1">
          <button
            type="button"
            class={
              'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
              (view === 'folders' || view === 'detail'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100')
            }
            onclick={goToFolders}
          >
            片夹
          </button>
          <button
            type="button"
            class={
              'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
              (view === 'categories'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100')
            }
            onclick={goToCategories}
          >
            分类管理
          </button>
          <button
            type="button"
            class={
              'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
              (view === 'borrows'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100')
            }
            onclick={goToBorrows}
          >
            借阅登记
          </button>
        </div>
      </div>
      <span class="text-sm text-gray-500">片夹与分类管理</span>
    </div>
  </nav>

  <main class="mx-auto max-w-6xl px-4 py-6">
    {#if view === 'folders'}
      <FolderList onselect={openDetail} />
    {:else if view === 'detail' && selectedId}
      <FolderDetail folderId={selectedId} onback={goToFolders} />
    {:else if view === 'categories'}
      <CategoryList />
    {:else if view === 'borrows'}
      <BorrowList onselect={openDetail} />
    {/if}
  </main>
</div>
