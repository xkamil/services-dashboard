import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () => {
  // The audit log (changelog) is written by server middleware after every
  // successful admin.* mutation. Mirror that on the client so the changelog
  // query refreshes automatically instead of requiring a page reload.
  const mutationCache = new MutationCache({
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const path = mutation.options.mutationKey?.[0];
      if (Array.isArray(path) && path[0] === "admin") {
        void queryClient.invalidateQueries({
          queryKey: [["admin", "audit", "list"]],
        });
      }
    },
  });

  const queryClient: QueryClient = new QueryClient({
    mutationCache,
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

  return queryClient;
};
