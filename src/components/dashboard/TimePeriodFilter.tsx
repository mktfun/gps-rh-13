
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface TimePeriodFilterProps {
  value: number;
  onChange: (value: number) => void;
}

export const TimePeriodFilter = ({ value, onChange }: TimePeriodFilterProps) => {
  const options = [
    { value: 6, label: 'Últimos 6 Meses' },
    { value: 12, label: 'Últimos 12 Meses' },
    { value: 12, label: 'Ano Atual', isCurrentYear: true }
  ];

  const handleValueChange = (stringValue: string) => {
    const numValue = parseInt(stringValue);
    onChange(numValue);
  };

  const getCurrentLabel = () => {
    const option = options.find(opt => opt.value === value);
    return option?.label || 'Últimos 6 Meses';
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value.toString()} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={getCurrentLabel()} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="6">Últimos 6 Meses</SelectItem>
          <SelectItem value="12">Últimos 12 Meses</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
