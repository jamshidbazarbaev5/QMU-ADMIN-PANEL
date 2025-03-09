interface Column {
  header: string
  accessor?: string
  cell?: (item: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  onRowClick?: (item: any) => void
  actions?: (item: any) => React.ReactNode
  currentLanguage?: string
}

export function DataTable({ data, columns, onRowClick, actions }: DataTableProps) {
  // Add a stable index to each item if it doesn't already have one
  // Use the item's existing order or created_at timestamp if available
  const stableData = data.map((item, index) => ({
    ...item,
    __stableIndex: item.order ?? item.created_at ?? item.__stableIndex ?? index
  }));

  // Sort by stable index to maintain original order
  const sortedData = [...stableData].sort((a, b) => {
    const aIndex = a.__stableIndex;
    const bIndex = b.__stableIndex;
    
    // Handle different types of ordering values
    if (typeof aIndex === 'string' && typeof bIndex === 'string') {
      // For timestamps or string-based ordering
      return aIndex.localeCompare(bIndex);
    }
    return (aIndex ?? 0) - (bIndex ?? 0);
  });

  return (
    <div className="overflow-x-auto ml-[40px]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider">
                Действия
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr
              key={item.id || index}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {column.cell ? column.cell(item) : column.accessor ? item[column.accessor] : undefined}
                  </div>
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}