// lib/api/react-query.ts
import {
  useQuery,
  useSuspenseQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseSuspenseQueryOptions,
  UseInfiniteQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchProperties,
  fetchExclusiveProperties,
  fetchLeaseProperties,
  fetchAllExclusiveProperties,
  fetchAllLeaseProperties,
  fetchPropertyByKey,
  fetchOntarioProperties,
  fetchPreConnProperties,
  fetchAllPreConnProperties,
  uploadPreConnProperties,
  fetchVlogPosts,
  fetchVlogPostBySlug,
  Property,
  PropertyFilterParams,
  ExclusivePropertyFilterParams,
  LeasePropertyFilterParams,
  fetchCompareProperties,
  PreConnPropertyFilterParams,
  VlogPost,
  fetchNewlyListedProperties,
  ExclusivePropertiesResponse,
  fetchFilteredProperties,
  PaginatedPropertyResult,
} from "../lib/api";

// Query keys for organized cache management
export const queryKeys = {
  properties: {
    all: ["properties"] as const,
    filters: (filters?: PropertyFilterParams) =>
      ["properties", "filters", filters] as const,
    city: (city?: string) => ["properties", "city", city] as const,
    ontario: ["properties", "ontario"] as const,
    filtered: (filters?: Record<string, any>) =>
      ["properties", "filtered", filters] as const,
    filteredInfinite: (filters?: Record<string, any>) =>
      ["properties", "filtered", "infinite", filters] as const,
  },
  exclusive: {
    all: ["properties", "exclusive"] as const,
    filters: (filters?: ExclusivePropertyFilterParams) =>
      ["properties", "exclusive", "filters", filters] as const,
    infinite: (filters?: Omit<ExclusivePropertyFilterParams, "offset">) =>
      ["properties", "exclusive", "infinite", filters] as const,
  },
  lease: {
    all: ["properties", "lease"] as const,
    filters: (filters?: LeasePropertyFilterParams) =>
      ["properties", "lease", "filters", filters] as const,
    infinite: (filters?: Omit<LeasePropertyFilterParams, "offset">) =>
      ["properties", "lease", "infinite", filters] as const,
  },
  preConn: {
    all: ["properties", "pre-conn"] as const,
    filters: (filters?: PreConnPropertyFilterParams) =>
      ["properties", "pre-conn", "filters", filters] as const,
    infinite: (filters?: Omit<PreConnPropertyFilterParams, "offset">) =>
      ["properties", "pre-conn", "infinite", filters] as const,
  },
  property: {
    detail: (propertyKey?: string) =>
      ["properties", "detail", propertyKey] as const,
  },
  vlog: {
    all: ["vlog"] as const,
    detail: (slug?: string) => ["vlog", "detail", slug] as const,
  },
  compare: {
    all: ["compare"] as const,
    properties: (propertyKeys: string[]) =>
      ["compare", "properties", ...propertyKeys] as const,
  },
  newlyListed: {
    all: ["properties", "newly-listed"] as const,
    filters: (filters?: PropertyFilterParams & { days_threshold?: number }) =>
      ["properties", "newly-listed", "filters", filters] as const,
  },
};

// Base query options for consistent configuration
const baseQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
} as const;

// React Query hooks for Properties
export const useProperties = (
  filters?: PropertyFilterParams,
  options?: Partial<UseQueryOptions<Property[], Error>>,
) => {
  return useQuery<Property[], Error>({
    queryKey: queryKeys.properties.filters(filters),
    queryFn: () => fetchProperties(filters),
    ...baseQueryOptions,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useOntarioProperties = (
  options?: Partial<UseQueryOptions<Property[], Error>>,
) => {
  return useQuery<Property[], Error>({
    queryKey: queryKeys.properties.ontario,
    queryFn: fetchOntarioProperties,
    ...baseQueryOptions,
    ...options,
  });
};

// React Query hooks for Exclusive Properties
export const useExclusiveProperties = (
  filters?: ExclusivePropertyFilterParams,
  options?: Partial<
    UseQueryOptions<
      ExclusivePropertiesResponse,
      Error
    >
  >,
) => {
  return useQuery({
    queryKey: queryKeys.exclusive.filters(filters),
    queryFn: () => fetchExclusiveProperties(filters),
    ...baseQueryOptions,
    ...options,
  });
};

export const useInfiniteExclusiveProperties = (
  filters?: Omit<ExclusivePropertyFilterParams, "offset">,
  options?: Partial<
    UseInfiniteQueryOptions<
      ExclusivePropertiesResponse,
      Error
    >
  >,
) => {
  const limit = filters?.limit || 12;

  return useInfiniteQuery({
    queryKey: queryKeys.exclusive.infinite(filters),
    queryFn: ({ pageParam = 0 }) =>
      fetchExclusiveProperties({
        ...filters,
        limit,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.flatMap((page) => page.results).length;
      return loadedItems < lastPage.count ? loadedItems : undefined;
    },
    initialPageParam: 0,
    ...baseQueryOptions,
    ...(options as any),
  });
};

export const useAllExclusiveProperties = (
  options?: Partial<UseQueryOptions<Property[], Error>>,
) => {
  return useQuery<Property[], Error>({
    queryKey: queryKeys.exclusive.all,
    queryFn: fetchAllExclusiveProperties,
    ...baseQueryOptions,
    ...options,
  });
};

export const useInfiniteFilteredProperties = (
  filters?: Record<string, any>,
  options?: Partial<
    UseInfiniteQueryOptions<
      PaginatedPropertyResult,
      Error
    >
  >,
) => {
  const limit = Number(filters?.limit) > 0 ? Number(filters?.limit) : 12;

  return useInfiniteQuery({
    queryKey: queryKeys.properties.filteredInfinite(filters),
    queryFn: ({ pageParam = 0 }) =>
      fetchFilteredProperties({
        ...filters,
        limit,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.flatMap((page) => page.results).length;
      return loadedItems < lastPage.count ? loadedItems : undefined;
    },
    initialPageParam: 0,
    ...baseQueryOptions,
    ...(options as any),
  });
};

// React Query hooks for Lease Properties
export const useLeaseProperties = (
  filters?: LeasePropertyFilterParams,
  options?: Partial<
    UseQueryOptions<
      {
        results: any[];
        count: number;
        next: number | null;
        previous: number | null;
      },
      Error
    >
  >,
) => {
  return useQuery({
    queryKey: queryKeys.lease.filters(filters),
    queryFn: () => fetchLeaseProperties(filters),
    ...baseQueryOptions,
    ...options,
  });
};

export const useInfiniteLeaseProperties = (
  filters?: Omit<LeasePropertyFilterParams, "offset">,
  options?: Partial<
    UseInfiniteQueryOptions<
      {
        results: any[];
        count: number;
        next: number | null;
        previous: number | null;
      },
      Error
    >
  >,
) => {
  const limit = filters?.limit || 6;

  return useInfiniteQuery({
    queryKey: queryKeys.lease.infinite(filters),
    queryFn: ({ pageParam = 0 }) =>
      fetchLeaseProperties({ ...filters, limit, offset: pageParam as number }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.flatMap((page) => page.results).length;
      return loadedItems < lastPage.count ? loadedItems : undefined;
    },
    initialPageParam: 0,
    ...baseQueryOptions,
    ...(options as any),
  });
};

export const useAllLeaseProperties = (
  options?: Partial<UseQueryOptions<Property[], Error>>,
) => {
  return useQuery<Property[], Error>({
    queryKey: queryKeys.lease.all,
    queryFn: fetchAllLeaseProperties,
    ...baseQueryOptions,
    ...options,
  });
};

// React Query hooks for Pre-Construction Properties
export const usePreConnProperties = (
  filters?: PreConnPropertyFilterParams,
  options?: Partial<
    UseQueryOptions<
      {
        results: any[];
        count: number;
        next: number | null;
        previous: number | null;
      },
      Error
    >
  >,
) => {
  return useQuery({
    queryKey: queryKeys.preConn.filters(filters),
    queryFn: () => fetchPreConnProperties(filters),
    ...baseQueryOptions,
    ...options,
  });
};

export const useInfinitePreConnProperties = (
  filters?: Omit<PreConnPropertyFilterParams, "offset">,
  options?: Partial<
    UseInfiniteQueryOptions<
      {
        results: any[];
        count: number;
        next: number | null;
        previous: number | null;
      },
      Error
    >
  >,
) => {
  const limit = filters?.limit || 6;

  return useInfiniteQuery({
    queryKey: queryKeys.preConn.infinite(filters),
    queryFn: ({ pageParam = 0 }) =>
      fetchPreConnProperties({
        ...filters,
        limit,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.flatMap((page) => page.results).length;
      return loadedItems < lastPage.count ? loadedItems : undefined;
    },
    initialPageParam: 0,
    ...baseQueryOptions,
    ...(options as any),
  });
};

export const useAllPreConnProperties = (
  options?: Partial<UseQueryOptions<Property[], Error>>,
) => {
  return useQuery<Property[], Error>({
    queryKey: queryKeys.preConn.all,
    queryFn: fetchAllPreConnProperties,
    staleTime: 10 * 60 * 1000, // Longer cache for pre-construction
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
};

// React Query hook for individual property
export const useProperty = (
  propertyKey?: string,
  options?: Partial<UseQueryOptions<Property | null, Error>>,
) => {
  return useQuery<Property | null, Error>({
    queryKey: queryKeys.property.detail(propertyKey),
    queryFn: () =>
      propertyKey ? fetchPropertyByKey(propertyKey) : Promise.resolve(null),
    enabled: !!propertyKey,
    ...baseQueryOptions,
    ...options,
  });
};

// Mutation for uploading pre-construction properties
export const useUploadPreConnProperties = (
  options?: UseMutationOptions<
    any,
    Error,
    {
      file?: File | null;
      options?: {
        fieldName?: string;
        authToken?: string | null;
        additionalFormFields?: Record<string, string>;
        useGet?: boolean;
      };
    }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, options: mutationOptions }) =>
      uploadPreConnProperties(file, mutationOptions),
    onSuccess: () => {
      // Invalidate pre-construction queries after successful upload
      queryClient.invalidateQueries({ queryKey: queryKeys.preConn.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.preConn.infinite({}),
      });
    },
    ...options,
  });
};

// React Query hooks for Vlog
export const useVlogPosts = (
  options?: Partial<UseQueryOptions<VlogPost[], Error>>,
) => {
  return useQuery<VlogPost[], Error>({
    queryKey: queryKeys.vlog.all,
    queryFn: fetchVlogPosts,
    ...baseQueryOptions,
    ...options,
  });
};

export const useVlogPost = (
  slug?: string,
  options?: Partial<UseQueryOptions<VlogPost | null, Error>>,
) => {
  return useQuery<VlogPost | null, Error>({
    queryKey: queryKeys.vlog.detail(slug),
    queryFn: () => (slug ? fetchVlogPostBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    ...baseQueryOptions,
    ...options,
  });
};

// Utility hook to prefetch property data on hover
export const usePrefetchProperty = () => {
  const queryClient = useQueryClient();

  return (propertyKey: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.property.detail(propertyKey),
      queryFn: () => fetchPropertyByKey(propertyKey),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };
};

// Utility hook to prefetch multiple properties
export const usePrefetchProperties = () => {
  const queryClient = useQueryClient();

  return (propertyKeys: string[]) => {
    propertyKeys.forEach((propertyKey) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.property.detail(propertyKey),
        queryFn: () => fetchPropertyByKey(propertyKey),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
    });
  };
};

// Utility hook to invalidate property queries
export const useInvalidateProperties = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.exclusive.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.lease.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.preConn.all });
  };
};

// Hook to prefetch all property data for the homepage
export const usePrefetchHomepageProperties = () => {
  const queryClient = useQueryClient();

  return async () => {
    // Prefetch common property queries for homepage
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.properties.ontario,
        queryFn: fetchOntarioProperties,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.exclusive.all,
        queryFn: fetchAllExclusiveProperties,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.preConn.all,
        queryFn: fetchAllPreConnProperties,
      }),
    ]);
  };
};

// Hook to get property by key with suspense (for loading states)
export const usePropertyWithSuspense = (
  propertyKey: string,
  options?: Partial<UseSuspenseQueryOptions<Property | null, Error>>,
) => {
  return useSuspenseQuery<Property | null, Error>({
    queryKey: queryKeys.property.detail(propertyKey),
    queryFn: () => fetchPropertyByKey(propertyKey),
    ...baseQueryOptions,
    ...options,
  });
};

// Optimistic updates for property favorites
export const useTogglePropertyFavorite = (
  options?: UseMutationOptions<
    void,
    Error,
    string,
    { previousProperty: Property | null | undefined }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyKey: string) => {
      // API call to toggle favorite
      // This is a placeholder - implement your actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    },
    onMutate: async (propertyKey: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.property.detail(propertyKey),
      });

      // Snapshot the previous value
      const previousProperty = queryClient.getQueryData<Property | null>(
        queryKeys.property.detail(propertyKey),
      );

      // Optimistically update to the new value
      if (previousProperty) {
        queryClient.setQueryData<Property | null>(
          queryKeys.property.detail(propertyKey),
          {
            ...previousProperty,
            isFavorite: !previousProperty.isFavorite,
          },
        );
      }

      return { previousProperty };
    },
    onError: (err, propertyKey, context) => {
      // Rollback on error
      if (context?.previousProperty) {
        queryClient.setQueryData(
          queryKeys.property.detail(propertyKey),
          context.previousProperty,
        );
      }
    },
    onSettled: (_, __, propertyKey) => {
      // Invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.property.detail(propertyKey),
      });
    },
    ...options,
  });
};

// Utility hook to fetch multiple properties at once
export const useMultipleProperties = (
  propertyKeys: string[],
  options?: Partial<UseQueryOptions<Property[], Error>>,
) => {
  return useQuery<Property[], Error>({
    queryKey: ["properties", "multiple", ...propertyKeys],
    queryFn: async () => {
      const results = await Promise.all(
        propertyKeys.map((key) => fetchPropertyByKey(key)),
      );
      return results.filter(
        (property): property is Property => property !== null,
      );
    },
    enabled: propertyKeys.length > 0,
    ...baseQueryOptions,
    ...options,
  });
};

// Hook to compare multiple properties
export const useCompareProperties = (
  propertyKeys: string[],
  options?: Partial<UseQueryOptions<{ results: any[]; count: number }, Error>>,
) => {
  return useQuery<{ results: any[]; count: number }, Error>({
    queryKey: queryKeys.compare.properties(propertyKeys),
    queryFn: () => fetchCompareProperties(propertyKeys),
    enabled: propertyKeys.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    ...options,
  });
};

export const useNewlyListedProperties = (
  filters?: PropertyFilterParams & { days_threshold?: number },
  options?: Partial<
    UseQueryOptions<
      {
        results: any[];
        count: number;
        next: number | null;
        previous: number | null;
      },
      Error
    >
  >,
) => {
  return useQuery({
    queryKey: queryKeys.newlyListed.filters(filters),
    queryFn: () => fetchNewlyListedProperties(filters),
    ...baseQueryOptions,
    ...options,
  });
};

export const useInfiniteNewlyListedProperties = (
  filters?: Omit<PropertyFilterParams & { days_threshold?: number }, "offset">,
  options?: Partial<
    UseInfiniteQueryOptions<
      {
        results: any[];
        count: number;
        next: number | null;
        previous: number | null;
      },
      Error
    >
  >,
) => {
  const limit = filters?.limit || 12;

  return useInfiniteQuery({
    queryKey: ["newly-listed", "infinite", filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchNewlyListedProperties({
        ...filters,
        limit,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.flatMap((page) => page.results).length;
      return loadedItems < lastPage.count ? loadedItems : undefined;
    },
    initialPageParam: 0,
    ...baseQueryOptions,
    ...(options as any),
  });
};

export type { Property };
