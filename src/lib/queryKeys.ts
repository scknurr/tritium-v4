export const queryKeys = {
  profiles: {
    all: ['profiles'] as const,
    list: (filter?: string) => ['profiles', 'list', filter] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
    customers: (id: string) => ['profiles', id, 'customers'] as const,
    skills: (id: string) => ['profiles', id, 'skills'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (filter?: string) => ['customers', 'list', filter] as const,
    detail: (id: number) => ['customers', 'detail', id] as const,
    users: (id: number) => ['customers', id, 'users'] as const,
    skills: (id: number) => ['customers', id, 'skills'] as const,
  },
  skills: {
    all: ['skills'] as const,
    list: (filter?: string) => ['skills', 'list', filter] as const,
    detail: (id: number) => ['skills', 'detail', id] as const,
    users: (id: number) => ['skills', id, 'users'] as const,
    customers: (id: number) => ['skills', id, 'customers'] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
  },
  industries: {
    all: ['industries'] as const,
    list: () => ['industries', 'list'] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: () => ['roles', 'list'] as const,
  },
  audit: {
    list: (entityType?: string, entityId?: string | number) => 
      ['audit', entityType, entityId] as const,
  }
};