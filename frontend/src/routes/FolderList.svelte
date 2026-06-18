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
    Select,
    Textarea,
    Alert,
    Spinner,
  } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import {
    fetchFolders,
    fetchFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchCategories,
  } from '../lib/folders.js';

  /** @type {{ onselect: (id: number) => void }} */
  let { onselect } = $props();

  const queryClient = useQueryClient();

  const foldersQuery = createQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  });

  const categoriesQuery = createQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  let showModal = $state(false);
  let editingId = $state(null);
  let loadingRemarks = $state(false);
  let originalRemarks = $state(null);
  let form = $state({ code: '', theme: '', era: '', storage_location: '', category_id: '', remarks: '' });
  let formError = $state('');

  const saveMutation = createMutation({
    mutationFn: async () => {
      /** @type {Record<string, any>} */
      const payload = {
        code: form.code,
        theme: form.theme,
        era: form.era,
        storage_location: form.storage_location,
        category_id: form.category_id ? Number(form.category_id) : null,
      };
      if (editingId) {
        const currentRemarks = form.remarks || null;
        if (currentRemarks !== originalRemarks) {
          payload.remarks = currentRemarks;
        }
        return updateFolder(editingId, payload);
      }
      payload.remarks = form.remarks || null;
      return createFolder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  function openCreate() {
    editingId = null;
    form = { code: '', theme: '', era: '', storage_location: '', category_id: '', remarks: '' };
    formError = '';
    showModal = true;
  }

  /**
   * @param {import('../lib/folders.js').Folder} folder
   */
  async function openEdit(folder, event) {
    event.stopPropagation();
    editingId = folder.id;
    loadingRemarks = true;
    formError = '';
    try {
      const detail = await fetchFolder(folder.id);
      originalRemarks = detail.remarks || null;
      form = {
        code: folder.code,
        theme: folder.theme,
        era: folder.era,
        storage_location: folder.storage_location,
        category_id: folder.category_id ? String(folder.category_id) : '',
        remarks: detail.remarks || '',
      };
      showModal = true;
    } catch (err) {
      formError = err.response?.data?.error || '加载备注失败';
      originalRemarks = null;
      form = {
        code: folder.code,
        theme: folder.theme,
        era: folder.era,
        storage_location: folder.storage_location,
        category_id: folder.category_id ? String(folder.category_id) : '',
        remarks: '',
      };
      showModal = true;
    } finally {
      loadingRemarks = false;
    }
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
        <TableHeadCell>分类</TableHeadCell>
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
            <TableBodyCell>
              {#if folder.category}
                <span class="inline-flex items-center gap-1.5">
                  <span
                    class="h-3 w-3 rounded-full border border-gray-300"
                    style="background-color: {folder.category.color}"
                  ></span>
                  <span class="text-sm text-gray-700">{folder.category.name}</span>
                </span>
              {:else}
                <span class="text-sm text-gray-400">—</span>
              {/if}
            </TableBodyCell>
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
      <Label for="category">所属分类</Label>
      <Select id="category" bind:value={form.category_id} placeholder="">
        <option value="">无分类</option>
        {#each $categoriesQuery.data ?? [] as cat (cat.id)}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </Select>
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
    <div>
      <Label for="remarks">备注</Label>
      {#if loadingRemarks}
        <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-400">
          <Spinner size="4" class="mx-auto mb-2" />
          加载备注中…
        </div>
      {:else}
        <Textarea
          id="remarks"
          bind:value={form.remarks}
          rows="4"
          placeholder="补充说明保管情况或来源信息"
        />
      {/if}
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeModal}>取消</Button>
      <Button type="submit" disabled={$saveMutation.isPending}>
        {$saveMutation.isPending ? '保存中…' : '保存'}
      </Button>
    </div>
  </form>
</Modal>
