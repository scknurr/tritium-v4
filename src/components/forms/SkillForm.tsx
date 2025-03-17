import React from 'react';
import { Modal, Button, Label, TextInput, Select, Textarea } from 'flowbite-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import type { Skill, SkillCategory } from '../../types';

interface SkillFormProps {
  skill: Partial<Skill>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Skill>) => Promise<void>;
}

export function SkillForm({ skill, isOpen, onClose, onSubmit }: SkillFormProps) {
  const [formData, setFormData] = React.useState<Partial<Skill>>(skill);
  const [loading, setLoading] = React.useState(false);

  const { data: categories, loading: loadingCategories } = useSupabaseQuery<SkillCategory>(
    'skill_categories',
    { orderBy: { column: 'name', ascending: true } }
  );

  // Update form data when skill prop changes
  React.useEffect(() => {
    setFormData(skill);
  }, [skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving skill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        {skill.id ? 'Edit Skill' : 'Add New Skill'}
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
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
              <Label htmlFor="category_id">Category</Label>
              <Select
                id="category_id"
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) || null })}
                disabled={loadingCategories}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
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