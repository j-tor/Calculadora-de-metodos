import React, { useState } from 'react';
import { ParameterMeta } from './types';
import { MatrixInputGrid } from './MatrixInputGrid';
import * as math from 'mathjs';

interface DynamicFormBuilderProps {
  parameters: ParameterMeta[];
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
}

export const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({ parameters, onSubmit, onCancel }) => {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    parameters.forEach(p => {
      if (p.default !== undefined) init[p.name] = p.default;
    });
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    parameters.forEach(p => {
      if (p.required && (values[p.name] === undefined || values[p.name] === '')) {
        newErrors[p.name] = 'Este campo es requerido';
      }
      
      if (p.type === 'function' && values[p.name]) {
        try {
          math.parse(values[p.name]);
        } catch (e) {
          newErrors[p.name] = 'Expresión matemática inválida';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  };

  const renderInput = (p: ParameterMeta) => {
    switch (p.type) {
      case 'function':
        return (
          <input 
            type="text" 
            className="w-full border border-gray-300 p-2 rounded text-black font-mono focus:ring focus:ring-blue-200"
            value={values[p.name] || ''}
            onChange={e => handleChange(p.name, e.target.value)}
            placeholder="Ej: sin(x) + x^2"
          />
        );
      case 'scalar':
        return (
          <input 
            type="number" 
            step="any"
            className="w-full border border-gray-300 p-2 rounded text-black focus:ring focus:ring-blue-200"
            value={values[p.name] ?? ''}
            onChange={e => handleChange(p.name, parseFloat(e.target.value))}
          />
        );
      case 'vector':
        return (
          <input 
            type="text" 
            className="w-full border border-gray-300 p-2 rounded text-black focus:ring focus:ring-blue-200"
            value={Array.isArray(values[p.name]) ? values[p.name].join(', ') : (values[p.name] || '')}
            onChange={e => {
              const str = e.target.value;
              const arr = str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
              handleChange(p.name, arr);
            }}
            placeholder="Ej: 1, 2.5, 3"
          />
        );
      case 'matrix':
        return (
          <MatrixInputGrid 
            onChange={data => handleChange(p.name, data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={validateAndSubmit} className="space-y-4 p-5 bg-white rounded-lg shadow-lg border border-gray-100 max-h-[75vh] overflow-y-auto w-full max-w-md">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Ingresar Parámetros</h3>
      
      {parameters.map(p => (
        <div key={p.name} className="flex flex-col gap-1">
          <label className="text-gray-700 font-semibold text-sm">
            {p.label} {p.required && <span className="text-red-500">*</span>}
          </label>
          {renderInput(p)}
          {errors[p.name] && <span className="text-red-500 text-xs mt-1">{errors[p.name]}</span>}
        </div>
      ))}
      
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded transition hover:bg-gray-200">
          Cancelar
        </button>
        <button type="submit" className="bg-blue-600 text-white font-medium px-4 py-2 rounded shadow transition hover:bg-blue-700 transform hover:scale-105">
          Ejecutar Método
        </button>
      </div>
    </form>
  );
};
