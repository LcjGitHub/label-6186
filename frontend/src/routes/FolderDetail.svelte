<script>
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import {
    Button,
    Modal,
    Label,
    Input,
    Textarea,
    Alert,
    Spinner,
    Badge,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import { ArrowLeftOutline, PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import {
    fetchFolder,
    createSlide,
    updateSlide,
    deleteSlide,
  } from '../lib/folders.js';

  /** @type {{ folderId: number, onback: () => void }} */
  let { folderId, onback } = $props();

  const queryClient = useQueryClient();

  let folderData = $state(null);
  let folderLoading = $state(true);
  let folderError = $state('');

  async function loadFolder() {
    folderLoading = true;
    folderError = '';
    try {
      folderData = await fetchFolder(folderId);
    } catch (err) {
      folderError = err.response?.data?.error || '加载失败';
      folderData = null;
    } finally {
      folderLoading = false;
    }
  }

  $effect(() => {
    if (folderId != null) {
      loadFolder();
    }
  });

  let showSlideModal = $state(false);
  let editingSlideId = $state(null);
  let slideForm = $state({ sequence: 1, description: '' });
  let slideError = $state('');

  const saveSlideMutation = createMutation({
    mutationFn: async () => {
      if (editingSlideId) {
        return updateSlide(editingSlideId, slideForm);
      }
      return createSlide(folderId, slideForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      loadFolder();
      closeSlideModal();
    },
    onError: (err) => {
      slideError = err.response?.data?.error || '保存失败';
    },
  });

  const deleteSlideMutation = createMutation({
    mutationFn: deleteSlide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      loadFolder();
    },
  });

  function openCreateSlide() {
    const slides = folderData?.slides ?? [];
    const nextSeq = slides.length
      ? Math.max(...slides.map((s) => s.sequence)) + 1
      : 1;
    editingSlideId = null;
    slideForm = { sequence: nextSeq, description: '' };
    slideError = '';
    showSlideModal = true;
  }

  /**
   * @param {{ id: number, sequence: number, description: string }} slide
   */
  function openEditSlide(slide) {
    editingSlideId = slide.id;
    slideForm = { sequence: slide.sequence, description: slide.description };
    slideError = '';
    showSlideModal = true;
  }

  function closeSlideModal() {
    showSlideModal = false;
    slideError = '';
  }

  function handleSlideSubmit(event) {
    event.preventDefault();
    slideError = '';
    $saveSlideMutation.mutate();
  }

  /**
   * @param {number} id
   */
  function handleDeleteSlide(id) {
    if (confirm('确定删除该单张？')) {
      $deleteSlideMutation.mutate(id);
    }
  }
</script>

<Button color="light" class="mb-4 gap-2" onclick={onback}>
  <ArrowLeftOutline class="h-4 w-4" />
  返回列表
</Button>

{#if folderLoading}
  <div class="flex justify-center py-16">
    <Spinner size="8" />
  </div>
{:else if folderError}
  <Alert color="red">加载失败，片夹可能已被删除</Alert>
{:else if folderData}
  {@const folder = folderData}

  <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">{folder.theme}</h1>
          <Badge color="blue">{folder.code}</Badge>
        </div>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt class="text-gray-500">张数</dt>
            <dd class="font-medium text-gray-900">{folder.slide_count} 张</dd>
          </div>
          <div>
            <dt class="text-gray-500">分类</dt>
            <dd class="font-medium text-gray-900">
              {#if folder.category}
                <span class="inline-flex items-center gap-1.5">
                  <span
                    class="h-3 w-3 rounded-full border border-gray-300"
                    style="background-color: {folder.category.color}"
                  ></span>
                  {folder.category.name}
                </span>
              {:else}
                <span class="text-gray-400">—</span>
              {/if}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">年代</dt>
            <dd class="font-medium text-gray-900">{folder.era}</dd>
          </div>
          <div>
            <dt class="text-gray-500">存储位置</dt>
            <dd class="font-medium text-gray-900">{folder.storage_location}</dd>
          </div>
        </dl>
      </div>
      <Button onclick={openCreateSlide} class="gap-2">
        <PlusOutline class="h-4 w-4" />
        添加单张
      </Button>
    </div>
  </div>

  <h2 class="mb-3 text-lg font-semibold text-gray-900">单张描述列表</h2>

  {#if folder.slides.length === 0}
    <Alert color="yellow">该片夹暂无单张，点击「添加单张」录入描述</Alert>
  {:else}
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table>
        <TableHead>
          <TableHeadCell class="w-24">序号</TableHeadCell>
          <TableHeadCell>描述</TableHeadCell>
          <TableHeadCell class="w-32 text-right">操作</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each folder.slides as slide (slide.id)}
            <TableBodyRow>
              <TableBodyCell class="font-medium">{slide.sequence}</TableBodyCell>
              <TableBodyCell>{slide.description}</TableBodyCell>
              <TableBodyCell class="text-right">
                <Button size="xs" color="light" onclick={() => openEditSlide(slide)}>
                  编辑
                </Button>
                <Button
                  size="xs"
                  color="red"
                  class="ml-2"
                  onclick={() => handleDeleteSlide(slide.id)}
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
{/if}

<Modal bind:open={showSlideModal} size="md" autoclose={false}>
  <form onsubmit={handleSlideSubmit} class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">
      {editingSlideId ? '编辑单张' : '添加单张'}
    </h3>

    {#if slideError}
      <Alert color="red">{slideError}</Alert>
    {/if}

    <div>
      <Label for="sequence">序号</Label>
      <Input
        id="sequence"
        type="number"
        min="1"
        bind:value={slideForm.sequence}
        required
      />
    </div>
    <div>
      <Label for="description">描述</Label>
      <Textarea
        id="description"
        bind:value={slideForm.description}
        required
        rows="4"
        placeholder="单张幻灯片内容描述"
      />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeSlideModal}>取消</Button>
      <Button type="submit" disabled={$saveSlideMutation.isPending}>
        {$saveSlideMutation.isPending ? '保存中…' : '保存'}
      </Button>
    </div>
  </form>
</Modal>
