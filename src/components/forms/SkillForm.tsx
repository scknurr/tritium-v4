import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select, Textarea } from 'flowbite-react';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { SVGIconEditor } from './SVGIconEditor';

interface SkillFormProps {
  skill?: {
    id: number;
    name: string;
    description?: string | null;
    category_id?: number | null;
    proficiency_levels?: string[] | null;
    svg_icon?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function SkillForm({ skill, isOpen, onClose, onSubmit }: SkillFormProps) {
  const [name, setName] = useState(skill?.name || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(skill?.category_id || undefined);
  const [proficiencyLevels, setProficiencyLevels] = useState<string[]>(
    skill?.proficiency_levels || ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  );
  const [svgIcon, setSvgIcon] = useState<string>(skill?.svg_icon || '');
  const [proficiencyInput, setProficiencyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [], loading: loadingCategories } = useSupabaseQuery(
    'skill_categories',
    { select: 'id, name' }
  );

  useEffect(() => {
    if (isOpen) {
      setName(skill?.name || '');
      setDescription(skill?.description || '');
      setCategoryId(skill?.category_id || undefined);
      setProficiencyLevels(
        skill?.proficiency_levels || ['Beginner', 'Intermediate', 'Advanced', 'Expert']
      );
      setSvgIcon(skill?.svg_icon || '');
      setProficiencyInput('');
    }
  }, [isOpen, skill]);

  const handleAddProficiency = () => {
    if (proficiencyInput.trim() && !proficiencyLevels.includes(proficiencyInput.trim())) {
      setProficiencyLevels([...proficiencyLevels, proficiencyInput.trim()]);
      setProficiencyInput('');
    }
  };

  const handleRemoveProficiency = (index: number) => {
    setProficiencyLevels(proficiencyLevels.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        description: description || null,
        category_id: categoryId || null,
        proficiency_levels: proficiencyLevels,
        svg_icon: svgIcon || null
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        {skill ? `Edit Skill: ${skill.name}` : 'Create New Skill'}
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" value="Skill Name" />
            <TextInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="category" value="Category" />
            <Select
              id="category"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              disabled={loadingCategories}
            >
              <option value="">Select a category</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="description" value="Description" />
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label value="Proficiency Levels" />
            <div className="flex flex-wrap gap-2">
              {proficiencyLevels.map((level, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {level}
                  <button
                    type="button"
                    className="hover:text-red-600 focus:outline-none"
                    onClick={() => handleRemoveProficiency(index)}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <TextInput
                value={proficiencyInput}
                onChange={(e) => setProficiencyInput(e.target.value)}
                placeholder="New proficiency level"
                className="flex-grow"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddProficiency();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddProficiency}
                disabled={!proficiencyInput.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Label value="Skill Icon" className="mb-2 block" />
            <SVGIconEditor
              initialSvgContent={svgIcon}
              skillName={name || 'Skill'}
              onSvgChange={setSvgIcon}
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
          className="ml-auto"
        >
          {isSubmitting ? 'Saving...' : skill ? 'Update Skill' : 'Create Skill'}
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}