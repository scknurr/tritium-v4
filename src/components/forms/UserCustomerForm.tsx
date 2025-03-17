import React, { useState } from 'react';
import { Modal, Button, Label, Select, TextInput } from 'flowbite-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import type { Profile, Customer } from '../../types';
import { formatFullName } from '../../lib/utils';

interface UserCustomerFormProps {
  userId?: string;
  customerId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { user_id: string; customer_id: number; start_date: string; end_date?: string }) => Promise<void>;
}

export function UserCustomerForm({ userId, customerId, isOpen, onClose, onSubmit }: UserCustomerFormProps) {
  // Initialize with today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    user_id: userId || '',
    customer_id: customerId || '',
    start_date: today,
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: users } = useSupabaseQuery<Profile>('profiles', {
    orderBy: { column: 'first_name', ascending: true }
  });

  const { data: customers } = useSupabaseQuery<Customer>('customers', {
    orderBy: { column: 'name', ascending: true }
  });

  const validateForm = () => {
    if (!formData.start_date) {
      setError('Start date is required');
      return false;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      setError('End date cannot be before start date');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Make sure we have valid values
    if (!formData.user_id || !formData.customer_id || !formData.start_date) {
      setError('Missing required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        user_id: formData.user_id,
        customer_id: Number(formData.customer_id),
        start_date: formData.start_date,
        end_date: formData.end_date || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving user-customer assignment:', error);
      setError('Failed to save assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>Assign User to Customer</Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="user_id">User</Label>
              <Select
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                required
                disabled={Boolean(userId)}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatFullName(user.first_name, user.last_name, user.email)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="customer_id">Customer</Label>
              <Select
                id="customer_id"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                required
                disabled={Boolean(customerId)}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <TextInput
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                min="2000-01-01"
                max="2099-12-31"
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <TextInput
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                max="2099-12-31"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}