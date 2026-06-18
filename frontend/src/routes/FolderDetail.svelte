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
    createBorrow,
    returnBorrow,
    fetchFolderBorrows,
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
      loadBorrowHistory();
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

  let showBorrowModal = $state(false);
  let borrowForm = $state({ borrower: '', borrow_date: '', expected_return_date: '' });
  let borrowError = $state('');

  let showReturnModal = $state(false);
  let returnBorrowId = $state(null);
  let returnDate = $state('');
  let returnError = $state('');

  let borrowHistory = $state([]);
  let borrowHistoryLoading = $state(false);

  const borrowMutation = createMutation({
    mutationFn: async () => {
      return createBorrow({
        folder_id: folderId,
        borrower: borrowForm.borrower,
        borrow_date: borrowForm.borrow_date,
        expected_return_date: borrowForm.expected_return_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['active-borrows'] });
      loadFolder();
      loadBorrowHistory();
      closeBorrowModal();
    },
    onError: (err) => {
      borrowError = err.response?.data?.error || '借出登记失败';
    },
  });

  const returnMutation = createMutation({
    mutationFn: async () => {
      return returnBorrow(returnBorrowId, returnDate || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['active-borrows'] });
      loadFolder();
      loadBorrowHistory();
      closeReturnModal();
    },
    onError: (err) => {
      returnError = err.response?.data?.error || '归还登记失败';
    },
  });

  async function loadBorrowHistory() {
    borrowHistoryLoading = true;
    try {
      borrowHistory = await fetchFolderBorrows(folderId);
    } catch {
      borrowHistory = [];
    } finally {
      borrowHistoryLoading = false;
    }
  }

  function openBorrowModal() {
    borrowForm = {
      borrower: '',
      borrow_date: new Date().toISOString().slice(0, 10),
      expected_return_date: '',
    };
    borrowError = '';
    showBorrowModal = true;
  }

  function closeBorrowModal() {
    showBorrowModal = false;
    borrowError = '';
  }

  function handleBorrowSubmit(event) {
    event.preventDefault();
    borrowError = '';
    $borrowMutation.mutate();
  }

  function openReturnModal(borrowId) {
    returnBorrowId = borrowId;
    returnDate = new Date().toISOString().slice(0, 10);
    returnError = '';
    showReturnModal = true;
  }

  function closeReturnModal() {
    showReturnModal = false;
    returnError = '';
  }

  function handleReturnSubmit(event) {
    event.preventDefault();
    returnError = '';
    $returnMutation.mutate();
  }

  function isOverdue(expectedDate) {
    if (!expectedDate) return false;
    return new Date(expectedDate) < new Date(new Date().toISOString().slice(0, 10));
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
          <div>
            <dt class="text-gray-500">借阅状态</dt>
            <dd class="font-medium">
              {#if folder.active_borrow}
                {#if isOverdue(folder.active_borrow.expected_return_date)}
                  <Badge color="red">已逾期</Badge>
                {:else}
                  <Badge color="yellow">借出中</Badge>
                {/if}
                <span class="ml-2 text-sm text-gray-600">
                  {folder.active_borrow.borrower} 借出于 {folder.active_borrow.borrow_date}，预计归还 {folder.active_borrow.expected_return_date}
                </span>
              {:else}
                <Badge color="green">在库</Badge>
              {/if}
            </dd>
          </div>
        </dl>
      </div>
      <div class="flex gap-2">
        {#if folder.active_borrow}
          <Button color="green" onclick={() => openReturnModal(folder.active_borrow.id)}>
            登记归还
          </Button>
        {:else}
          <Button color="yellow" onclick={openBorrowModal}>
            登记借出
          </Button>
        {/if}
        <Button onclick={openCreateSlide} class="gap-2">
          <PlusOutline class="h-4 w-4" />
          添加单张
        </Button>
      </div>
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

  <div class="mt-8 mb-3 flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-900">借阅记录</h2>
    <Button size="sm" color="light" onclick={loadBorrowHistory}>刷新</Button>
  </div>

  {#if borrowHistoryLoading}
    <div class="flex justify-center py-8">
      <Spinner size="6" />
    </div>
  {:else if borrowHistory.length > 0}
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table>
        <TableHead>
          <TableHeadCell>借阅人</TableHeadCell>
          <TableHeadCell>借出日期</TableHeadCell>
          <TableHeadCell>预计归还</TableHeadCell>
          <TableHeadCell>实际归还</TableHeadCell>
          <TableHeadCell>状态</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each borrowHistory as record (record.id)}
            <TableBodyRow>
              <TableBodyCell class="font-medium">{record.borrower}</TableBodyCell>
              <TableBodyCell>{record.borrow_date}</TableBodyCell>
              <TableBodyCell>{record.expected_return_date}</TableBodyCell>
              <TableBodyCell>{record.actual_return_date ?? '—'}</TableBodyCell>
              <TableBodyCell>
                {#if record.actual_return_date}
                  <Badge color="green">已归还</Badge>
                {:else if isOverdue(record.expected_return_date)}
                  <Badge color="red">已逾期</Badge>
                {:else}
                  <Badge color="yellow">借出中</Badge>
                {/if}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {:else}
    <p class="text-sm text-gray-400">暂无借阅记录</p>
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

<Modal bind:open={showBorrowModal} size="md" autoclose={false}>
  <form onsubmit={handleBorrowSubmit} class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">登记借出</h3>

    {#if borrowError}
      <Alert color="red">{borrowError}</Alert>
    {/if}

    <div>
      <Label for="fd-borrower">借阅人</Label>
      <Input id="fd-borrower" bind:value={borrowForm.borrower} required placeholder="借阅人姓名" />
    </div>
    <div>
      <Label for="fd-borrow-date">借出日期</Label>
      <Input id="fd-borrow-date" type="date" bind:value={borrowForm.borrow_date} required />
    </div>
    <div>
      <Label for="fd-expected-return">预计归还日期</Label>
      <Input id="fd-expected-return" type="date" bind:value={borrowForm.expected_return_date} required />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeBorrowModal}>取消</Button>
      <Button type="submit" disabled={$borrowMutation.isPending}>
        {$borrowMutation.isPending ? '处理中…' : '确认借出'}
      </Button>
    </div>
  </form>
</Modal>

<Modal bind:open={showReturnModal} size="md" autoclose={false}>
  <form onsubmit={handleReturnSubmit} class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">登记归还</h3>

    {#if returnError}
      <Alert color="red">{returnError}</Alert>
    {/if}

    <div>
      <Label for="fd-return-date">实际归还日期</Label>
      <Input id="fd-return-date" type="date" bind:value={returnDate} required />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeReturnModal}>取消</Button>
      <Button type="submit" color="green" disabled={$returnMutation.isPending}>
        {$returnMutation.isPending ? '处理中…' : '确认归还'}
      </Button>
    </div>
  </form>
</Modal>
