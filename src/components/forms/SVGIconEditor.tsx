import React, { useState, useEffect } from 'react';
import { Button, TextInput, Textarea, Label } from 'flowbite-react';
import { Upload, Check, AlertTriangle } from 'lucide-react';
import { SkillIcon } from '../ui/SkillIcon';

interface SVGIconEditorProps {
  initialSvgContent?: string;
  skillName: string;
  onSvgChange: (svgContent: string) => void;
}

export function SVGIconEditor({ initialSvgContent = '', skillName, onSvgChange }: SVGIconEditorProps) {
  const [svgContent, setSvgContent] = useState(initialSvgContent);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isValidSvg, setIsValidSvg] = useState(true);
  
  // Update parent component when SVG content changes
  useEffect(() => {
    if (isValidSvg) {
      onSvgChange(svgContent);
    }
  }, [svgContent, isValidSvg, onSvgChange]);
  
  // Validate SVG content when it changes
  useEffect(() => {
    try {
      if (!svgContent) {
        setIsValidSvg(true);
        setPreviewError(null);
        return;
      }
      
      // Basic SVG validation
      if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
        setIsValidSvg(false);
        setPreviewError('Invalid SVG format. Content must include <svg> tags.');
        return;
      }
      
      // Check for potentially malicious content
      const dangerousContent = [
        '<script', 'javascript:', 'onerror=', 'onload=', 'eval(', 'Function('
      ];
      
      const hasDangerousContent = dangerousContent.some(term => 
        svgContent.toLowerCase().includes(term.toLowerCase())
      );
      
      if (hasDangerousContent) {
        setIsValidSvg(false);
        setPreviewError('SVG contains potentially unsafe content.');
        return;
      }
      
      // SVG is valid if we get here
      setIsValidSvg(true);
      setPreviewError(null);
    } catch (error) {
      setIsValidSvg(false);
      setPreviewError('Error validating SVG: ' + String(error));
    }
  }, [svgContent]);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verify file type
      if (!file.type.includes('svg')) {
        setFileUploadError('Please upload an SVG file.');
        return;
      }
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setSvgContent(event.target.result);
        }
      };
      reader.onerror = () => {
        setFileUploadError('Failed to read the file.');
      };
      reader.readAsText(file);
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSvgContent(e.target.value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/2">
          <Label htmlFor="svg-upload" value="Upload SVG Icon" />
          <div className="mt-2 flex items-center gap-2">
            <TextInput
              id="svg-upload"
              type="file"
              accept=".svg"
              onChange={handleFileUpload}
              helperText="Upload an SVG file for this skill"
            />
            <Button 
              size="sm" 
              gradientDuoTone="purpleToBlue" 
              onClick={() => document.getElementById('svg-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          {fileUploadError && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {fileUploadError}
            </div>
          )}
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <Label value="Icon Preview" className="self-start md:self-center" />
          <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center">
            <SkillIcon 
              name={skillName}
              svgContent={isValidSvg ? svgContent : ''}
              size="lg"
            />
            {isValidSvg && svgContent ? (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Valid SVG
              </div>
            ) : svgContent ? (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {previewError}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500">
                Auto-generated icon
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="svg-content" value="SVG Content" />
        <Textarea
          id="svg-content"
          rows={6}
          value={svgContent}
          onChange={handleTextChange}
          placeholder="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>...</svg>"
          className="font-mono text-sm mt-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Paste or edit raw SVG markup. The icon will be used to represent this skill throughout the application.
        </p>
      </div>
    </div>
  );
} 