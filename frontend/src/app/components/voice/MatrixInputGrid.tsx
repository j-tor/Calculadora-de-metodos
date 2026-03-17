import React, { useState, useEffect } from 'react';

interface MatrixInputGridProps {
  initialRows?: number;
  initialCols?: number;
  onChange: (data: number[][]) => void;
}

export const MatrixInputGrid: React.FC<MatrixInputGridProps> = ({ 
  initialRows = 3, 
  initialCols = 3, 
  onChange 
}) => {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [data, setData] = useState<number[][]>(() => 
    Array(initialRows).fill(0).map(() => Array(initialCols).fill(0))
  );

  useEffect(() => {
    setData(Array(rows).fill(0).map(() => Array(cols).fill(0)));
  }, [rows, cols]);

  const handleChange = (r: number, c: number, v: string) => {
    const val = parseFloat(v) || 0;
    const newData = [...data];
    newData[r] = [...newData[r]];
    newData[r][c] = val;
    setData(newData);
    onChange(newData);
  };

  return (
    <div className="matrix-input-container space-y-2">
      <div className="matrix-dimensions flex gap-4 text-black">
        <label className="flex flex-col text-sm text-gray-700">
          Filas:
          <input type="number" min="1" max="10" value={rows} onChange={e => setRows(parseInt(e.target.value) || 1)} className="border rounded px-2 py-1 w-20" />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Columnas:
          <input type="number" min="1" max="10" value={cols} onChange={e => setCols(parseInt(e.target.value) || 1)} className="border rounded px-2 py-1 w-20" />
        </label>
      </div>
      <div className="matrix-grid grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {data.map((row, r) => (
          row.map((val, c) => (
            <input
              key={`${r}-${c}`}
              type="number"
              value={Number.isNaN(val) ? '' : val}
              onChange={e => handleChange(r, c, e.target.value)}
              className="border p-2 w-full text-center rounded text-black bg-gray-50 focus:bg-white focus:ring focus:ring-blue-300"
            />
          ))
        ))}
      </div>
    </div>
  );
};
