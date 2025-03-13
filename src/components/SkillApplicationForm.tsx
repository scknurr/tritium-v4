import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { createSkillApplication, updateSkillApplication } from '../lib/api';
import { SkillApplication } from '../types';
import { toast } from 'react-hot-toast';

const proficiencyLevels = [
  { value: 'NOVICE', label: 'Novice' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
];

const formSchema = z.object({
  skill_id: z.number().min(1, 'Please select a skill'),
  customer_id: z.number().min(1, 'Please select a customer'),
  proficiency: z.string().min(1, 'Please select a proficiency level'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

type FormValues = z.infer<typeof formSchema>;

type SkillApplicationFormProps = {
  userId: string;
  skills: { id: number; name: string }[];
  customers: { id: number; name: string }[];
  existingApplication?: SkillApplication;
  onSuccess: () => void;
  onCancel: () => void;
};

export const SkillApplicationForm: React.FC<SkillApplicationFormProps> = ({
  userId,
  skills,
  customers,
  existingApplication,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingApplication 
      ? {
          skill_id: existingApplication.skill_id,
          customer_id: existingApplication.customer_id,
          proficiency: existingApplication.proficiency,
          start_date: existingApplication.start_date,
          end_date: existingApplication.end_date,
          notes: existingApplication.notes
        }
      : {
          skill_id: 0,
          customer_id: 0,
          proficiency: '',
          start_date: '',
          end_date: '',
          notes: ''
        }
  });
  
  useEffect(() => {
    if (existingApplication) {
      reset({
        skill_id: existingApplication.skill_id,
        customer_id: existingApplication.customer_id,
        proficiency: existingApplication.proficiency,
        start_date: existingApplication.start_date,
        end_date: existingApplication.end_date,
        notes: existingApplication.notes
      });
    }
  }, [existingApplication, reset]);
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (existingApplication) {
        await updateSkillApplication(existingApplication.id, data);
        toast.success('Skill application updated successfully');
      } else {
        await createSkillApplication({
          user_id: userId,
          ...data
        });
        toast.success('Skill application created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting skill application:', error);
      toast.error('Failed to save skill application');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="skill_id">Skill</Label>
        <Select
          id="skill_id"
          {...register('skill_id', { valueAsNumber: true })}
          error={errors.skill_id?.message}
        >
          <option value="">Select a skill</option>
          {skills.map(skill => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </Select>
      </div>
      
      <div>
        <Label htmlFor="customer_id">Customer</Label>
        <Select
          id="customer_id"
          {...register('customer_id', { valueAsNumber: true })}
          error={errors.customer_id?.message}
        >
          <option value="">Select a customer</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </div>
      
      <div>
        <Label htmlFor="proficiency">Proficiency Level</Label>
        <Select
          id="proficiency"
          {...register('proficiency')}
          error={errors.proficiency?.message}
        >
          <option value="">Select proficiency level</option>
          {proficiencyLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </Select>
      </div>
      
      <div>
        <Label htmlFor="start_date">Start Date (Optional)</Label>
        <Input
          id="start_date"
          type="date"
          {...register('start_date')}
          error={errors.start_date?.message}
        />
      </div>
      
      <div>
        <Label htmlFor="end_date">End Date (Optional)</Label>
        <Input
          id="end_date"
          type="date"
          {...register('end_date')}
          error={errors.end_date?.message}
        />
      </div>
      
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          error={errors.notes?.message}
          placeholder="Add any additional information"
          className="h-24"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : existingApplication ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default SkillApplicationForm; 