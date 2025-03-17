import React from 'react';
import { Button } from 'flowbite-react';
import { Pencil, Trash2, Upload, Camera } from 'lucide-react';

interface EntityHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  onEdit: () => void;
  onDelete: () => void;
  onImageUpload?: (file: File) => Promise<void>;
  imageUrl?: string;
  children?: React.ReactNode;
  entityType: 'user' | 'customer' | 'skill';
  tags?: Array<{label: string; color?: string}>;
}

export function EntityHeader({ 
  title, 
  subtitle, 
  description,
  onEdit, 
  onDelete, 
  onImageUpload,
  imageUrl,
  children,
  entityType,
  tags = []
}: EntityHeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      try {
        await onImageUpload(e.target.files[0]);
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    }
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Determine placeholder and styles based on entity type
  const getPlaceholderStyles = () => {
    switch(entityType) {
      case 'user':
        return {
          classes: 'rounded-full bg-gradient-to-br from-blue-400 to-indigo-600',
          placeholder: title.charAt(0).toUpperCase()
        };
      case 'customer':
        return {
          classes: 'rounded-lg bg-gradient-to-br from-green-400 to-teal-600',
          placeholder: title.slice(0, 2).toUpperCase()
        };
      case 'skill':
        return {
          classes: 'rounded-lg bg-gradient-to-br from-purple-400 to-pink-600',
          placeholder: title.slice(0, 2).toUpperCase()
        };
      default:
        return {
          classes: 'rounded-lg bg-gradient-to-br from-gray-400 to-gray-600',
          placeholder: '?'
        };
    }
  };

  const placeholderStyles = getPlaceholderStyles();

  return (
    <div className="relative">
      {/* Banner background - subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-lg -mx-6 -mt-6"></div>
      
      <div className="relative flex flex-col md:flex-row gap-6 pt-8">
        {/* Image/Avatar section */}
        <div className="flex-shrink-0 z-10">
          <div 
            className="relative group cursor-pointer"
            onClick={triggerFileUpload}
          >
            {imageUrl ? (
              <div className={`w-24 h-24 md:w-32 md:h-32 ${entityType === 'user' ? 'rounded-full' : 'rounded-lg'} overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg`}>
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-24 h-24 md:w-32 md:h-32 ${placeholderStyles.classes} flex items-center justify-center text-white text-3xl md:text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-lg`}>
                {placeholderStyles.placeholder}
              </div>
            )}
            
            {/* Upload overlay */}
            {onImageUpload && (
              <>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Content section */}
        <div className="z-10 flex-grow">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
            )}
            
            {description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-2xl">{description}</p>
            )}
            
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.color || 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions section */}
        <div className="z-10 flex-shrink-0 flex flex-row md:flex-col gap-2 md:ml-auto">
          <Button size="sm" gradientDuoTone="purpleToBlue" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" color="failure" outline onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          {children}
        </div>
      </div>
    </div>
  );
}