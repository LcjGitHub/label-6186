<script>
  import { SearchOutline } from 'flowbite-svelte-icons';

  /** @type {{ onsearch: (keyword: string) => void, initialValue?: string }} */
  let { onsearch, initialValue = '' } = $props();

  /** @type {HTMLInputElement | null} */
  let inputEl = null;

  function handleSubmit(event) {
    event.preventDefault();
    if (inputEl) {
      const keyword = inputEl.value.trim();
      if (keyword) {
        onsearch(keyword);
      }
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
  }

  $effect(() => {
    if (inputEl && initialValue && inputEl.value !== initialValue) {
      inputEl.value = initialValue;
    }
  });
</script>

<form onsubmit={handleSubmit} class="relative flex-1 max-w-md">
  <div class="relative">
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <SearchOutline class="h-4 w-4 text-gray-400" />
    </div>
    <input
      bind:this={inputEl}
      type="text"
      placeholder="搜索片夹主题、编号或单张描述..."
      onkeydown={handleKeydown}
      value={initialValue}
      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
    />
  </div>
</form>
