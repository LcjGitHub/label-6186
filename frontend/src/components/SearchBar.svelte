<script>
  import { SearchOutline } from 'flowbite-svelte-icons';
  import { Input } from 'flowbite-svelte';

  /** @type {(keyword: string) => void} */
  let { onsearch } = $props();

  let searchText = $state('');

  function handleSubmit(event) {
    event.preventDefault();
    const keyword = searchText.trim();
    if (keyword) {
      onsearch(keyword);
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      searchText = '';
    }
  }
</script>

<form onsubmit={handleSubmit} class="relative flex-1 max-w-md">
  <div class="relative">
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <SearchOutline class="h-4 w-4 text-gray-400" />
    </div>
    <Input
      type="text"
      placeholder="搜索片夹主题、编号或单张描述..."
      bind:value={searchText}
      onkeydown={handleKeydown}
      class="!pl-10 !pr-4 !py-2"
    />
  </div>
</form>
