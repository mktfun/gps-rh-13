
import { TableBody } from '@/components/ui/table';
import { EnhancedTableSkeleton } from '@/components/ui/enhanced-loading';

interface EmpresaTableSkeletonProps {
  rows?: number;
}

export const EmpresaTableSkeleton = ({ rows = 5 }: EmpresaTableSkeletonProps) => {
  return (
    <TableBody>
      <tr>
        <td colSpan={7} className="p-0">
          <EnhancedTableSkeleton 
            rows={rows} 
            columns={7} 
            showHeader={false}
            animated={true}
          />
        </td>
      </tr>
    </TableBody>
  );
};
