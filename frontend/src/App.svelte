<script>
  import Dashboard from './routes/Dashboard.svelte';
  import FolderList from './routes/FolderList.svelte';
  import FolderDetail from './routes/FolderDetail.svelte';
  import CategoryList from './routes/CategoryList.svelte';
  import BorrowList from './routes/BorrowList.svelte';
  import SearchResults from './routes/SearchResults.svelte';
  import SearchBar from './components/SearchBar.svelte';

  /** @type {'dashboard' | 'folders' | 'detail' | 'categories' | 'borrows' | 'search'} */
  let view = $state('dashboard');
  /** @type {number | null} */
  let selectedId = $state(null);
  /** @type {string} */
  let searchKeyword = $state('');
  /** @type {number | null} */
  let highlightSlideId = $state(null);

  /**
   * 进入片夹详情
   * @param {number} id
   * @param {number} [slideId]
   */
  function openDetail(id, slideId) {
    selectedId = id;
    highlightSlideId = slideId ?? null;
    view = 'detail';
  }

  /**
   * 执行搜索
   * @param {string} keyword
   */
  function handleSearch(keyword) {
    searchKeyword = keyword;
    view = 'search';
    selectedId = null;
    highlightSlideId = null;
  }

  /**
   * 从搜索结果选择片夹
   * @param {number} id
   */
  function handleSelectFolder(id) {
    openDetail(id);
  }

  /**
   * 从搜索结果选择单张
   * @param {number} folderId
   * @param {number} slideId
   */
  function handleSelectSlide(folderId, slideId) {
    openDetail(folderId, slideId);
  }

  function goToDashboard() {
    view = 'dashboard';
    selectedId = null;
    highlightSlideId = null;
  }

  function goToFolders() {
    view = 'folders';
    selectedId = null;
    highlightSlideId = null;
  }

  function goToCategories() {
    view = 'categories';
    selectedId = null;
    highlightSlideId = null;
  }

  function goToBorrows() {
    view = 'borrows';
    selectedId = null;
    highlightSlideId = null;
  }
</script>

<div class="min-h-screen">
  <nav class="border-b border-gray-200 bg-white shadow-sm">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
      <div class="flex items-center gap-6 flex-shrink-0">
        <button
          type="button"
          class="text-xl font-semibold text-gray-900 hover:text-blue-600"
          onclick={goToDashboard}
        >
          幻灯片片夹管理
        </button>
        <div class="flex gap-1">
          <button
            type="button"
            class={
              'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
              (view === 'dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100')
            }
            onclick={goToDashboard}
          >
            统计看板
          </button>
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
      <SearchBar onsearch={handleSearch} />
    </div>
  </nav>

  <main class="mx-auto max-w-6xl px-4 py-6">
    {#if view === 'dashboard'}
      <Dashboard />
    {:else if view === 'folders'}
      <FolderList onselect={openDetail} />
    {:else if view === 'detail' && selectedId}
      <FolderDetail folderId={selectedId} onback={goToFolders} highlightSlideId={highlightSlideId} />
    {:else if view === 'categories'}
      <CategoryList />
    {:else if view === 'borrows'}
      <BorrowList onselect={openDetail} />
    {:else if view === 'search'}
      <SearchResults
        keyword={searchKeyword}
        onselectfolder={handleSelectFolder}
        onselectslide={handleSelectSlide}
      />
    {/if}
  </main>
</div>
