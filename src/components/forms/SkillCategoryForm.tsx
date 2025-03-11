import React, { useEffect } from 'react';
import { Modal, Button, Label, TextInput, Textarea } from 'flowbite-react';
import type { SkillCategory } from '../../types';

interface SkillCategoryFormProps {
  category: Partial<SkillCategory>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<SkillCategory>) => Promise<void>;
}

export function SkillCategoryForm({ category, isOpen, onClose, onSubmit }: SkillCategoryFormProps) {
  const [formData, setFormData] = React.useState<Partial<SkillCategory>>(category);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        {category.id ? 'Edit Category' : 'Add New Category'}
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
                rows={3}
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