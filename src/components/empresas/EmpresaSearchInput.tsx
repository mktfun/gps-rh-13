
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EmpresaSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const EmpresaSearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Buscar por nome, responsável ou email...",
  debounceMs = 300 
}: EmpresaSearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-8 pr-8"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
