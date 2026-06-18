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
    Alert,
    Spinner,
    Badge,
  } from 'flowbite-svelte';
  import { fetchActiveBorrows, returnBorrow, fetchFolders, createBorrow } from '../lib/folders.js';

  /** @type {{ onselect?: (id: number) => void }} */
  let { onselect } = $props();

  const queryClient = useQueryClient();

  const borrowsQuery = createQuery({
    queryKey: ['active-borrows'],
    queryFn: fetchActiveBorrows,
  });

  const foldersQuery = createQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  });

  let showReturnModal = $state(false);
  let returnBorrowId = $state(null);
  let returnDate = $state('');
  let returnError = $state('');

  let showBorrowModal = $state(false);
  let borrowForm = $state({ folder_id: '', borrower: '', borrow_date: '', expected_return_date: '' });
  let borrowError = $state('');

  const returnMutation = createMutation({
    mutationFn: async () => {
      return returnBorrow(returnBorrowId, returnDate || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-borrows'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      closeReturnModal();
    },
    onError: (err) => {
      returnError = err.response?.data?.error || '归还登记失败';
    },
  });

  const borrowMutation = createMutation({
    mutationFn: async () => {
      return createBorrow({
        folder_id: Number(borrowForm.folder_id),
        borrower: borrowForm.borrower,
        borrow_date: borrowForm.borrow_date,
        expected_return_date: borrowForm.expected_return_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-borrows'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      closeBorrowModal();
    },
    onError: (err) => {
      borrowError = err.response?.data?.error || '借出登记失败';
    },
  });

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

  function openBorrowModal() {
    borrowForm = { folder_id: '', borrower: '', borrow_date: new Date().toISOString().slice(0, 10), expected_return_date: '' };
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

  function isOverdue(expectedDate) {
    if (!expectedDate) return false;
    return new Date(expectedDate) < new Date(new Date().toISOString().slice(0, 10));
  }
</script>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">借阅登记</h1>
    <p class="mt-1 text-sm text-gray-500">查看当前未归还的借阅记录，登记借出与归还</p>
  </div>
  <Button onclick={openBorrowModal} class="gap-2">
    登记借出
  </Button>
</div>

{#if $borrowsQuery.isLoading}
  <div class="flex justify-center py-16">
    <Spinner size="8" />
  </div>
{:else if $borrowsQuery.isError}
  <Alert color="red">加载失败，请确认后端已启动（端口 8000）</Alert>
{:else if ($borrowsQuery.data ?? []).length === 0}
  <Alert color="green">当前无未归还的借阅记录</Alert>
{:else}
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <Table hoverable>
      <TableHead>
        <TableHeadCell>片夹编号</TableHeadCell>
        <TableHeadCell>片夹主题</TableHeadCell>
        <TableHeadCell>借阅人</TableHeadCell>
        <TableHeadCell>借出日期</TableHeadCell>
        <TableHeadCell>预计归还</TableHeadCell>
        <TableHeadCell>状态</TableHeadCell>
        <TableHeadCell class="text-right">操作</TableHeadCell>
      </TableHead>
      <TableBody>
        {#each $borrowsQuery.data ?? [] as record (record.id)}
          <TableBodyRow class={onselect ? 'cursor-pointer' : ''} onclick={() => onselect?.(record.folder_id)}>
            <TableBodyCell class="font-medium text-blue-600">{record.folder_code}</TableBodyCell>
            <TableBodyCell>{record.folder_theme}</TableBodyCell>
            <TableBodyCell>{record.borrower}</TableBodyCell>
            <TableBodyCell>{record.borrow_date}</TableBodyCell>
            <TableBodyCell>{record.expected_return_date}</TableBodyCell>
            <TableBodyCell>
              {#if isOverdue(record.expected_return_date)}
                <Badge color="red">已逾期</Badge>
              {:else}
                <Badge color="yellow">借出中</Badge>
              {/if}
            </TableBodyCell>
            <TableBodyCell class="text-right">
              <Button size="xs" color="green" onclick={(e) => { e.stopPropagation(); openReturnModal(record.id); }}>
                登记归还
              </Button>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
{/if}

<Modal bind:open={showReturnModal} size="md" autoclose={false}>
  <form onsubmit={handleReturnSubmit} class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">登记归还</h3>

    {#if returnError}
      <Alert color="red">{returnError}</Alert>
    {/if}

    <div>
      <Label for="return-date">实际归还日期</Label>
      <Input id="return-date" type="date" bind:value={returnDate} required />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeReturnModal}>取消</Button>
      <Button type="submit" color="green" disabled={$returnMutation.isPending}>
        {$returnMutation.isPending ? '处理中…' : '确认归还'}
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
      <Label for="borrow-folder">片夹</Label>
      <Select id="borrow-folder" bind:value={borrowForm.folder_id} required>
        <option value="">请选择片夹</option>
        {#each ($foldersQuery.data ?? []).filter(f => !f.active_borrow) as folder (folder.id)}
          <option value={folder.id}>{folder.code} - {folder.theme}</option>
        {/each}
      </Select>
      <p class="mt-1 text-xs text-gray-500">仅显示当前未被借出的片夹</p>
    </div>
    <div>
      <Label for="borrower">借阅人</Label>
      <Input id="borrower" bind:value={borrowForm.borrower} required placeholder="借阅人姓名" />
    </div>
    <div>
      <Label for="borrow-date">借出日期</Label>
      <Input id="borrow-date" type="date" bind:value={borrowForm.borrow_date} required />
    </div>
    <div>
      <Label for="expected-return">预计归还日期</Label>
      <Input id="expected-return" type="date" bind:value={borrowForm.expected_return_date} required />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button color="alternative" type="button" onclick={closeBorrowModal}>取消</Button>
      <Button type="submit" disabled={$borrowMutation.isPending}>
        {$borrowMutation.isPending ? '处理中…' : '确认借出'}
      </Button>
    </div>
  </form>
</Modal>
