import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, Select } from 'flowbite-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { UTILIZATION_LEVELS } from '../../lib/constants';
import type { Customer, Skill } from '../../types';

interface CustomerSkillFormProps {
  customerId?: number;
  skillId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { customer_id: number; skill_id: number; utilization_level: string }) => Promise<void>;
  editData?: {
    customer_id: number;
    skill_id: number;
    utilization_level: string;
  };
}

export function CustomerSkillForm({
  customerId,
  skillId,
  isOpen,
  onClose,
  onSubmit,
  editData
}: CustomerSkillFormProps) {
  const [formData, setFormData] = useState({
    customer_id: customerId || '',
    skill_id: skillId || '',
    utilization_level: 'low'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
        customer_id: customerId || '',
        skill_id: skillId || '',
        utilization_level: 'low'
      });
    }
  }, [editData, customerId, skillId]);

  const { data: customers } = useSupabaseQuery<Customer>('customers', {
    orderBy: { column: 'name', ascending: true }
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
        customer_id: Number(formData.customer_id),
        skill_id: Number(formData.skill_id)
      });
      onClose();
    } catch (error) {
      console.error('Error saving customer skill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose}>
      <Modal.Header>
        {editData ? 'Edit Skill Requirement' : 'Add Skill Requirement'}
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer_id">Customer</Label>
              <Select
                id="customer_id"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                required
                disabled={Boolean(customerId) || Boolean(editData)}
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
              <Label htmlFor="utilization_level">Utilization Level</Label>
              <Select
                id="utilization_level"
                value={formData.utilization_level}
                onChange={(e) => setFormData({ ...formData, utilization_level: e.target.value })}
                required
              >
                {UTILIZATION_LEVELS.map((level) => (
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