import React, { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, Button, Input, Label, Select, Textarea } from '../ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSkillApplication, updateSkillApplication, deleteSkillApplication } from '../../lib/api';
import { SkillApplication } from '../../types';
import { GraduationCap, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Define simple versions of types for the form
interface SimpleSkill {
  id: number;
  name: string;
}

interface SimpleCustomer {
  id: number;
  name: string;
}

// Define the form schema
const formSchema = z.object({
  skill_id: z.number().min(1, 'Please select a skill'),
  customer_id: z.number().min(1, 'Please select a customer'),
  proficiency: z.string().min(1, 'Please select a proficiency level'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

type FormValues = z.infer<typeof formSchema>;

type SkillApplicationDialogProps = {
  userId: string;
  existingApplication?: SkillApplication | null;
  onClose: () => void;
};

const PROFICIENCY_LEVELS = [
  { value: 'NOVICE', label: 'Novice' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
];

const SkillApplicationDialog: React.FC<SkillApplicationDialogProps> = ({
  userId,
  existingApplication,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<SimpleSkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [customers, setCustomers] = useState<SimpleCustomer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  // Fetch skills and customers on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingSkills(true);
      setIsLoadingCustomers(true);
      
      try {
        // Fetch skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('id, name')
          .order('name');
        
        if (skillsError) throw skillsError;
        setSkills(skillsData as SimpleSkill[] || []);
        
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name')
          .order('name');
        
        if (customersError) throw customersError;
        setCustomers(customersData as SimpleCustomer[] || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load skills or customers. Please try again.');
      } finally {
        setIsLoadingSkills(false);
        setIsLoadingCustomers(false);
      }
    };
    
    fetchData();
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingApplication 
      ? {
          skill_id: existingApplication.skill_id,
          customer_id: existingApplication.customer_id,
          proficiency: existingApplication.proficiency,
          start_date: existingApplication.start_date || undefined,
          end_date: existingApplication.end_date || undefined,
          notes: existingApplication.notes || undefined
        }
      : {
          skill_id: 0,
          customer_id: 0,
          proficiency: '',
          start_date: undefined,
          end_date: undefined,
          notes: undefined
        }
  });

  useEffect(() => {
    if (existingApplication) {
      reset({
        skill_id: existingApplication.skill_id,
        customer_id: existingApplication.customer_id,
        proficiency: existingApplication.proficiency,
        start_date: existingApplication.start_date || undefined,
        end_date: existingApplication.end_date || undefined,
        notes: existingApplication.notes || undefined
      });
    }
  }, [existingApplication, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (existingApplication) {
        await updateSkillApplication(existingApplication.id, data);
      } else {
        await createSkillApplication({
          user_id: userId,
          ...data
        });
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving skill application:', err);
      setError('Failed to save the skill application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingApplication || !window.confirm('Are you sure you want to delete this skill application?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteSkillApplication(existingApplication.id);
      onClose();
    } catch (err) {
      console.error('Error deleting skill application:', err);
      setError('Failed to delete the skill application. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {existingApplication ? 'Edit Skill Application' : 'Apply Skill at Customer'}
        </DialogTitle>
      </DialogHeader>

      {error && (
        <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="skill_id">Skill</Label>
          <Select
            id="skill_id"
            disabled={isLoading || isLoadingSkills}
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

        <div className="space-y-1">
          <Label htmlFor="customer_id">Customer</Label>
          <Select
            id="customer_id"
            disabled={isLoading || isLoadingCustomers}
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

        <div className="space-y-1">
          <Label htmlFor="proficiency">Proficiency Level</Label>
          <Select
            id="proficiency"
            disabled={isLoading}
            {...register('proficiency')}
            error={errors.proficiency?.message}
          >
            <option value="">Select proficiency level</option>
            {PROFICIENCY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="start_date">Start Date (Optional)</Label>
            <Input
              id="start_date"
              type="date"
              disabled={isLoading}
              {...register('start_date')}
            />
            {errors.start_date && (
              <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Input
              id="end_date"
              type="date"
              disabled={isLoading}
              {...register('end_date')}
            />
            {errors.end_date && (
              <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            disabled={isLoading}
            placeholder="Add any additional information"
            className="h-20"
            {...register('notes')}
          />
          {errors.notes && (
            <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {existingApplication ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          
          <div className="flex gap-2">
            {existingApplication && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : existingApplication ? 'Update' : 'Apply Skill'}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  );
};

export default SkillApplicationDialog; 