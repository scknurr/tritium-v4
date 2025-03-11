import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, Select } from 'flowbite-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { PROFICIENCY_LEVELS } from '../../lib/constants';
import type { Profile, Skill } from '../../types';

interface UserSkillFormProps {
  userId?: string;
  skillId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { user_id: string; skill_id: number; proficiency_level: string }) => Promise<void>;
  editData?: {
    user_id: string;
    skill_id: number;
    proficiency_level: string;
  };
}

export function UserSkillForm({
  userId,
  skillId,
  isOpen,
  onClose,
  onSubmit,
  editData
}: UserSkillFormProps) {
  const [formData, setFormData] = useState({
    user_id: userId || '',
    skill_id: skillId || '',
    proficiency_level: 'beginner'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
        user_id: userId || '',
        skill_id: skillId || '',
        proficiency_level: 'beginner'
      });
    }
  }, [editData, userId, skillId]);

  const { data: users } = useSupabaseQuery<Profile>('profiles', {
    orderBy: { column: 'full_name', ascending: true }
  });

  const { data: skills } = useSupabaseQuery<Skill>('skills', {
    orderBy: { column: 'name', ascending: true }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        skill_id: Number(formData.skill_id)
      });
      onClose();
    } catch (error) {
      console.error('Error saving user skill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        {editData ? 'Edit Skill Assignment' : 'Assign Skill to User'}
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">User</Label>
              <Select
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                required
                disabled={Boolean(userId) || Boolean(editData)}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="skill_id">Skill</Label>
              <Select
                id="skill_id"
                value={formData.skill_id}
                onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                required
                disabled={Boolean(skillId) || Boolean(editData)}
              >
                <option value="">Select a skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="proficiency_level">Proficiency Level</Label>
              <Select
                id="proficiency_level"
                value={formData.proficiency_level}
                onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
                required
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
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