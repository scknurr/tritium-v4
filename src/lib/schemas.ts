import { z } from 'zod';

// Common schemas
const idSchema = z.union([z.string(), z.number()]);
const dateSchema = z.string().datetime();
const emailSchema = z.string().email();
const urlSchema = z.string().url().optional().nullable();

// Profile schema
export const profileSchema = z.object({
  id: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  title: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  extended_data: z.record(z.unknown()).optional().nullable(),
  created_at: dateSchema
});

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  website: urlSchema,
  status: z.enum(['active', 'historical']).default('active'),
  industry_id: z.number().optional().nullable(),
  industry: z.object({
    id: z.number(),
    name: z.string()
  }).optional(),
  created_at: dateSchema
});

// Skill schema
export const skillSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  category_id: z.number().optional().nullable(),
  category: z.object({
    id: z.number(),
    name: z.string()
  }).optional(),
  created_at: dateSchema
});

// Relationship schemas
export const userCustomerSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  customer_id: z.number(),
  role_id: z.number(),
  start_date: z.string(),
  end_date: z.string().optional().nullable()
});

export const userSkillSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  skill_id: z.number(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
});

export const customerSkillSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  skill_id: z.number(),
  utilization_level: z.enum(['low', 'medium', 'high', 'critical'])
});

// Form schemas
export const profileFormSchema = profileSchema.pick({
  first_name: true,
  last_name: true,
  email: true,
  title: true,
  bio: true
});

export const customerFormSchema = customerSchema.pick({
  name: true,
  website: true,
  status: true,
  industry_id: true
});

export const skillFormSchema = skillSchema.pick({
  name: true,
  category_id: true
});

export const userCustomerFormSchema = userCustomerSchema.pick({
  user_id: true,
  customer_id: true,
  role_id: true,
  start_date: true,
  end_date: true
});

export const userSkillFormSchema = userSkillSchema.pick({
  user_id: true,
  skill_id: true,
  proficiency_level: true
});

export const customerSkillFormSchema = customerSkillSchema.pick({
  customer_id: true,
  skill_id: true,
  utilization_level: true
});

export type Profile = z.infer<typeof profileSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type UserCustomer = z.infer<typeof userCustomerSchema>;
export type UserSkill = z.infer<typeof userSkillSchema>;
export type CustomerSkill = z.infer<typeof customerSkillSchema>;

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type CustomerFormData = z.infer<typeof customerFormSchema>;
export type SkillFormData = z.infer<typeof skillFormSchema>;
export type UserCustomerFormData = z.infer<typeof userCustomerFormSchema>;
export type UserSkillFormData = z.infer<typeof userSkillFormSchema>;
export type CustomerSkillFormData = z.infer<typeof customerSkillFormSchema>;