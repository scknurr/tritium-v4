import React from 'react';
import { Modal, Button, Label, TextInput, Select, Textarea } from 'flowbite-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import type { Customer } from '../../types';

interface Industry {
  id: number;
  name: string;
}

interface CustomerFormProps {
  customer: Partial<Customer>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Customer>) => Promise<void>;
}

export function CustomerForm({ customer, isOpen, onClose, onSubmit }: CustomerFormProps) {
  const [formData, setFormData] = React.useState<Partial<Customer>>(customer);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: industries, loading: loadingIndustries } = useSupabaseQuery<Industry>(
    'industries',
    { orderBy: { column: 'name', ascending: true } }
  );

  // Update form data when customer prop changes
  React.useEffect(() => {
    setFormData(customer);
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!formData.name) {
        throw new Error('Name is required');
      }

      // Only include fields that are in the customers table
      const dataToSubmit = {
        name: formData.name,
        description: formData.description,
        website: formData.website,
        status: formData.status,
        industry_id: formData.industry_id
      };

      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        {customer.id ? 'Edit Customer' : 'Add New Customer'}
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="name">Name</Label>
              <TextInput
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <TextInput
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="industry_id">Industry</Label>
              <Select
                id="industry_id"
                value={formData.industry_id || ''}
                onChange={(e) => setFormData({ ...formData, industry_id: Number(e.target.value) || null })}
                disabled={loadingIndustries}
              >
                <option value="">Select an industry</option>
                {industries.map((industry: Industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="active">Active</option>
                <option value="historical">Historical</option>
              </Select>
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