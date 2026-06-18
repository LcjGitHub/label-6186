<script>
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import FolderApp from './App.svelte';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
</script>

<QueryClientProvider client={queryClient}>
  <FolderApp />
</QueryClientProvider>
