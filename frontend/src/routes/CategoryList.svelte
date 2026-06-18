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
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } from '../lib/folders.js';

  const queryClient = useQueryClient();

  const categoriesQuery = createQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  let showModal = $state(false);
  let editingId = $state(null);
  let form = $state({ name: '', color: '#3b82f6' });
  let formError = $state('');

  const colorPresets = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#6b7280',
  ];

  const saveMutation = createMutation({
    mutationFn: async () => {
      if (editingId) {
        return updateCategory(editingId, form);
      }
      return createCategory(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      closeModal();
    },
    onError: (err) => {
      formError = err.response?.data?.error || '保存失败';
    },
  });

  const deleteMutation = createMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  function openCreate() {
    editingId = null;
    form = { name: '', color: '#3b82f6' };
    formError = '';
    showModal = true;
  }

  /**
   * @param {import('../lib/folders.js').Category} category
   */
  function openEdit(category, event) {
    event.stopPropagation();
    editingId = category.id;
    form = {
      name: category.name,
      color: category.color,
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
    if (confirm('确定删除该分类？关联的片夹将取消分类关联。')) {
      $deleteMutation.mutate(id);
    }
  }
</script>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">分类管理</h1>
    <p class="mt-1 text-sm text-gray-500">管理片夹分类，支持颜色标记</p>
  </div>
  <Button onclick={openCreate} class="gap-2">
    <PlusOutline class="h-4 w-4" />
    新建分类
  </Button>
</div>

{#if $categoriesQuery.isLoading}
  <div class="flex justify-center py-16">
    <Spinner size="8" />
  </div>
{:else if $categoriesQuery.isError}
  <Alert color="red">加载失败，请确认后端已启动（端口 8000）</Alert>
{:else if ($categoriesQuery.data ?? []).length === 0}
  <Alert color="yellow">暂无分类，点击「新建分类」添加</Alert>
{:else}
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <Table hoverable>
      <TableHead>
        <TableHeadCell>颜色</TableHeadCell>
        <TableHeadCell>分类名称</TableHeadCell>
        <TableHeadCell class="text-right">操作</TableHeadCell>
      </TableHead>
      <TableBody>
        {#each $categoriesQuery.data ?? [] as category (category.id)}
          <TableBodyRow>
            <TableBodyCell>
              <div
                class="h-6 w-6 rounded-full border border-gray-300 shadow-inner"
                style="background-color: {category.color}"
                title={category.color}
              ></div>
            </TableBodyCell>
            <TableBodyCell class="font-medium text-gray-900">{category.name}</TableBodyCell>
            <TableBodyCell class="text-right">
              <Button size="xs" color="light" onclick={(e) => openEdit(category, e)}>编辑</Button>
              <Button
                size="xs"
                color="red"
                class="ml-2"
                onclick={(e) => handleDelete(category.id, e)}
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
      {editingId ? '编辑分类' : '新建分类'}
    </h3>

    {#if formError}
      <Alert color="red">{formError}</Alert>
    {/if}

    <div>
      <Label for="cat-name">分类名称</Label>
      <Input id="cat-name" bind:value={form.name} required placeholder="如 风景、人物、纪实" />
    </div>
    <div>
      <Label>颜色标记</Label>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        {#each colorPresets as color}
          <button
            type="button"
            class="h-8 w-8 rounded-full border-2 transition hover:scale-110"
            style="background-color: {color}; border-color: {form.color === color ? '#1f2937' : 'transparent'}"
            onclick={() => (form.color = color)}
            title={color}
          ></button>
        {/each}
        <div class="ml-2 flex items-center gap-2">
          <input
            type="color"
            bind:value={form.color}
            class="h-8 w-8 cursor-pointer rounded border border-gray-300 bg-white p-0"
          />
          <span class="text-xs text-gray-500 font-mono">{form.color}</span>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeModal}>取消</Button>
      <Button type="submit" disabled={$saveMutation.isPending}>
        {$saveMutation.isPending ? '保存中…' : '保存'}
      </Button>
    </div>
  </form>
</Modal>
