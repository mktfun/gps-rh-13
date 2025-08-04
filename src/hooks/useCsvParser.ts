
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { ParsedCsvData } from '@/types/import';

interface UseCsvParserReturn {
  parseFile: (file: File) => Promise<ParsedCsvData>;
  isLoading: boolean;
  error: string | null;
}

export const useCsvParser = (): UseCsvParserReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File): Promise<ParsedCsvData> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          setIsLoading(false);
          
          if (results.errors.length > 0) {
            const errorMsg = results.errors.map(err => err.message).join(', ');
            setError(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          const data = results.data as any[][];
          
          // Remove linhas vazias
          const cleanData = data.filter(row => 
            row.some(cell => cell && cell.toString().trim() !== '')
          );

          if (cleanData.length === 0) {
            setError('Arquivo CSV vazio ou inválido');
            reject(new Error('Arquivo CSV vazio'));
            return;
          }

          const headers = cleanData[0];
          const dataRows = cleanData.slice(1);
          
          // Preview das primeiras 5 linhas
          const preview = dataRows.slice(0, 5);

          resolve({
            headers,
            data: dataRows,
            preview
          });
        },
        header: false,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        error: (error) => {
          setIsLoading(false);
          setError(error.message);
          reject(error);
        }
      });
    });
  }, []);

  return {
    parseFile,
    isLoading,
    error
  };
};
