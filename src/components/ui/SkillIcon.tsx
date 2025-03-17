import React from 'react';
import { GraduationCap } from 'lucide-react';

export type SkillIconSize = 'sm' | 'md' | 'lg' | 'xl';

interface SkillIconProps {
  name: string;
  svgContent?: string;
  size?: SkillIconSize;
  className?: string;
}

const getIconSize = (size: SkillIconSize): { width: number; height: number; fontSize: string } => {
  switch (size) {
    case 'sm':
      return { width: 24, height: 24, fontSize: '0.75rem' };
    case 'md':
      return { width: 32, height: 32, fontSize: '0.875rem' };
    case 'lg':
      return { width: 48, height: 48, fontSize: '1.125rem' };
    case 'xl':
      return { width: 64, height: 64, fontSize: '1.5rem' };
    default:
      return { width: 32, height: 32, fontSize: '0.875rem' };
  }
};

export function SkillIcon({ name, svgContent, size = 'md', className = '' }: SkillIconProps) {
  const { width, height, fontSize } = getIconSize(size);
  
  // If SVG content is provided, render it directly
  if (svgContent) {
    return (
      <div 
        className={`inline-flex items-center justify-center ${className}`} 
        style={{ width, height }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }
  
  // Generate the background gradient based on the skill name
  const generateGradient = (skillName: string) => {
    // Using the character codes of the name to create a deterministic gradient
    const charSum = skillName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = charSum % 360;
    const hue2 = (hue1 + 40) % 360;
    
    return `hsl(${hue1}, 70%, 65%), hsl(${hue2}, 70%, 50%)`;
  };
  
  const gradient = generateGradient(name);
  const initials = name.slice(0, 2).toUpperCase();
  
  return (
    <div
      className={`rounded-lg overflow-hidden shadow-sm inline-flex items-center justify-center text-white font-bold ${className}`}
      style={{ 
        width, 
        height, 
        background: `linear-gradient(135deg, ${gradient})`,
        fontSize 
      }}
    >
      {initials}
    </div>
  );
}

// Wrapper component to render a fallback Lucide icon if needed
export function SkillIconWithFallback({ 
  name, 
  svgContent, 
  size = 'md', 
  className = '' 
}: SkillIconProps) {
  if (!svgContent && !name) {
    // If neither SVG nor name is provided, render a default icon
    const { width, height } = getIconSize(size);
    return <GraduationCap style={{ width, height }} className={className} />;
  }
  
  return <SkillIcon name={name} svgContent={svgContent} size={size} className={className} />;
} 