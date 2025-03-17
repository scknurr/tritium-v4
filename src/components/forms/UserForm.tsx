import React, { useState } from 'react';
import { Modal, Button, Label, TextInput, Textarea } from 'flowbite-react';
import { useMutationWithCache } from '../../lib/hooks/useMutationWithCache';
import { useMutation } from '@tanstack/react-query';
import type { Profile } from '../../types';
import { parseFullNameToFirstLast, formatFullName } from '@/lib/utils';

interface UserFormProps {
  user: Partial<Profile>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Profile>) => Promise<void>;
}

export function UserForm({ user, isOpen, onClose, onSubmit }: UserFormProps) {
  const [formData, setFormData] = useState<Partial<Profile>>(user);
  const [isLoading, setIsLoading] = useState(false);

  const { update: updateUser } = useMutationWithCache<Profile>({
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
      setIsLoading(true);
      try {
        await updateUser({ id: formData.id, data: formData });
      } finally {
        setIsLoading(false);
      }
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
              <Label htmlFor="first_name">First Name</Label>
              <TextInput
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <TextInput
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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