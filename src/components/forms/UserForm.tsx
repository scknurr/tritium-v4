import React from 'react';
import { Modal, Button, Label, TextInput, Textarea } from 'flowbite-react';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import type { Profile } from '../../types';

interface UserFormProps {
  user: Partial<Profile>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Profile>) => Promise<void>;
}

export function UserForm({ user, isOpen, onClose, onSubmit }: UserFormProps) {
  const [formData, setFormData] = React.useState<Partial<Profile>>(user);

  const { update: updateUser, isLoading } = useMutationWithCache<Profile>({
    table: 'profiles',
    invalidateQueries: ['profiles', 'audit'],
    successMessage: 'User updated successfully',
    onSuccess: () => {
      onSubmit(formData);
      onClose();
    }
  });

  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      await updateUser({ id: formData.id, data: formData });
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        {user.id ? 'Edit User' : 'Add New User'}
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <TextInput
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <TextInput
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <TextInput
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}