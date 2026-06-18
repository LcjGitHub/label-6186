<script>
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
    Modal,
    Label,
    Input,
    Alert,
    Spinner,
  } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import {
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  } from '../lib/folders.js';

  /** @type {{ onselect: (id: number) => void }} */
  let { onselect } = $props();

  const queryClient = useQueryClient();

  const foldersQuery = createQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  });

  let showModal = $state(false);
  let editingId = $state(null);
  let form = $state({ code: '', theme: '', era: '', storage_location: '' });
  let formError = $state('');

  const saveMutation = createMutation({
    mutationFn: async () => {
      if (editingId) {
        return updateFolder(editingId, form);
      }
      return createFolder(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      closeModal();
    },
    onError: (err) => {
      formError = err.response?.data?.error || '保存失败';
    },
  });

  const deleteMutation = createMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  function openCreate() {
    editingId = null;
    form = { code: '', theme: '', era: '', storage_location: '' };
    formError = '';
    showModal = true;
  }

  /**
   * @param {import('../lib/folders.js').Folder} folder
   */
  function openEdit(folder, event) {
    event.stopPropagation();
    editingId = folder.id;
    form = {
      code: folder.code,
      theme: folder.theme,
      era: folder.era,
      storage_location: folder.storage_location,
    };
    formError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    formError = '';
  }

  function handleSubmit(event) {
    event.preventDefault();
    formError = '';
    $saveMutation.mutate();
  }

  /**
   * @param {number} id
   * @param {Event} event
   */
  function handleDelete(id, event) {
    event.stopPropagation();
    if (confirm('确定删除该片夹及其所有单张？')) {
      $deleteMutation.mutate(id);
    }
  }
</script>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">片夹列表</h1>
    <p class="mt-1 text-sm text-gray-500">点击行查看详情与单张描述</p>
  </div>
  <Button onclick={openCreate} class="gap-2">
    <PlusOutline class="h-4 w-4" />
    新建片夹
  </Button>
</div>

{#if $foldersQuery.isLoading}
  <div class="flex justify-center py-16">
    <Spinner size="8" />
  </div>
{:else if $foldersQuery.isError}
  <Alert color="red">加载失败，请确认后端已启动（端口 8000）</Alert>
{:else if ($foldersQuery.data ?? []).length === 0}
  <Alert color="yellow">暂无片夹，点击「新建片夹」添加</Alert>
{:else}
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <Table hoverable>
      <TableHead>
        <TableHeadCell>编号</TableHeadCell>
        <TableHeadCell>主题</TableHeadCell>
        <TableHeadCell>张数</TableHeadCell>
        <TableHeadCell>年代</TableHeadCell>
        <TableHeadCell>存储位置</TableHeadCell>
        <TableHeadCell class="text-right">操作</TableHeadCell>
      </TableHead>
      <TableBody>
        {#each $foldersQuery.data ?? [] as folder (folder.id)}
          <TableBodyRow
            class="cursor-pointer"
            onclick={() => onselect(folder.id)}
          >
            <TableBodyCell class="font-medium text-blue-600">{folder.code}</TableBodyCell>
            <TableBodyCell>{folder.theme}</TableBodyCell>
            <TableBodyCell>{folder.slide_count}</TableBodyCell>
            <TableBodyCell>{folder.era}</TableBodyCell>
            <TableBodyCell>{folder.storage_location}</TableBodyCell>
            <TableBodyCell class="text-right">
              <Button size="xs" color="light" onclick={(e) => openEdit(folder, e)}>编辑</Button>
              <Button
                size="xs"
                color="red"
                class="ml-2"
                onclick={(e) => handleDelete(folder.id, e)}
              >
                <TrashBinOutline class="h-3 w-3" />
              </Button>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
{/if}

<Modal bind:open={showModal} size="md" autoclose={false}>
  <form onsubmit={handleSubmit} class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">
      {editingId ? '编辑片夹' : '新建片夹'}
    </h3>

    {#if formError}
      <Alert color="red">{formError}</Alert>
    {/if}

    <div>
      <Label for="code">编号</Label>
      <Input id="code" bind:value={form.code} required placeholder="如 SF-004" />
    </div>
    <div>
      <Label for="theme">主题</Label>
      <Input id="theme" bind:value={form.theme} required placeholder="片夹主题" />
    </div>
    <div>
      <Label for="era">年代</Label>
      <Input id="era" bind:value={form.era} required placeholder="如 1990年代" />
    </div>
    <div>
      <Label for="storage">存储位置</Label>
      <Input
        id="storage"
        bind:value={form.storage_location}
        required
        placeholder="如 A柜-第1层"
      />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeModal}>取消</Button>
      <Button type="submit" disabled={$saveMutation.isPending}>
        {$saveMutation.isPending ? '保存中…' : '保存'}
      </Button>
    </div>
  </form>
</Modal>
