import React from 'react';
import { Table, Worksheet } from '../types';

interface TableSelectorProps {
  worksheets: Worksheet[];
  tables: Table[];
  selectedTableId: string | null;
  onTableSelect: (tableId: string) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  worksheets,
  tables,
  selectedTableId,
  onTableSelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Select a Table or Worksheet</h3>
      
      {(!worksheets || worksheets.length === 0) && (!tables || tables.length === 0) ? (
        <p className="text-gray-500">No data found in the Excel file.</p>
      ) : (
        <div className="space-y-2">
          {tables && tables.map((table) => (
            <div
              key={table.id}
              onClick={() => onTableSelect(table.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTableId === table.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{table.display_name}</div>
              <div className="text-sm text-gray-500">
                Worksheet: {table.worksheet} | Range: {table.range}
              </div>
              <div className="text-sm text-gray-500">
                {table.rows} rows × {table.columns} columns
              </div>
            </div>
          ))}
          
          {worksheets && worksheets.filter(ws => ws.has_data).map((worksheet) => {
            const worksheetTableId = `worksheet_${worksheet.name}`;
            return (
              <div
                key={worksheet.name}
                onClick={() => onTableSelect(worksheetTableId)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTableId === worksheetTableId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Full Worksheet: {worksheet.name}</div>
                <div className="text-sm text-gray-500">
                  {worksheet.rows} rows × {worksheet.columns} columns
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};