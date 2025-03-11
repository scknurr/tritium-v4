import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { UseFormProps } from 'react-hook-form';

export function useForm<T extends z.ZodType>(
  schema: T,
  options: Omit<UseFormProps<z.infer<T>>, 'resolver'> = {}
) {
  return useHookForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options
  });
}