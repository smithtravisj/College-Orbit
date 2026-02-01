'use client';

import { useState, useMemo } from 'react';
import { Select } from '@/components/ui/Input';
import Input from '@/components/ui/Input';
import { ArrowLeftRight } from 'lucide-react';

interface UnitConverterProps {
  theme?: string;
}

type UnitCategory = 'length' | 'weight' | 'temperature' | 'volume';

interface Unit {
  value: string;
  label: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const unitCategories: { value: UnitCategory; label: string }[] = [
  { value: 'length', label: 'Length' },
  { value: 'weight', label: 'Weight / Mass' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'volume', label: 'Volume' },
];

const lengthUnits: Unit[] = [
  { value: 'mm', label: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { value: 'cm', label: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  { value: 'm', label: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
  { value: 'km', label: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { value: 'in', label: 'Inches (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  { value: 'ft', label: 'Feet (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  { value: 'yd', label: 'Yards (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  { value: 'mi', label: 'Miles (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
];

const weightUnits: Unit[] = [
  { value: 'mg', label: 'Milligrams (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
  { value: 'g', label: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { value: 'kg', label: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
  { value: 'oz', label: 'Ounces (oz)', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  { value: 'lb', label: 'Pounds (lb)', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
  { value: 't', label: 'Metric Tons (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
];

const temperatureUnits: Unit[] = [
  { value: 'c', label: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
  { value: 'f', label: 'Fahrenheit (°F)', toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
  { value: 'k', label: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
];

const volumeUnits: Unit[] = [
  { value: 'ml', label: 'Milliliters (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { value: 'l', label: 'Liters (L)', toBase: (v) => v, fromBase: (v) => v },
  { value: 'floz', label: 'Fluid Ounces (fl oz)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
  { value: 'cup', label: 'Cups', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
  { value: 'pt', label: 'Pints (pt)', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
  { value: 'gal', label: 'Gallons (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
];

const unitsByCategory: Record<UnitCategory, Unit[]> = {
  length: lengthUnits,
  weight: weightUnits,
  temperature: temperatureUnits,
  volume: volumeUnits,
};

const defaultUnits: Record<UnitCategory, { from: string; to: string }> = {
  length: { from: 'm', to: 'ft' },
  weight: { from: 'kg', to: 'lb' },
  temperature: { from: 'c', to: 'f' },
  volume: { from: 'l', to: 'gal' },
};

function formatNumber(num: number): string {
  if (num === 0) return '0';
  if (Math.abs(num) < 0.000001 || Math.abs(num) >= 1e9) return num.toExponential(4);
  return parseFloat(num.toFixed(6)).toString();
}

export default function UnitConverter({ theme: _theme }: UnitConverterProps) {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState(defaultUnits.length.from);
  const [toUnit, setToUnit] = useState(defaultUnits.length.to);
  const [fromValue, setFromValue] = useState('1');

  const units = unitsByCategory[category];

  const result = useMemo(() => {
    const value = parseFloat(fromValue);
    if (isNaN(value)) return '';
    const from = units.find(u => u.value === fromUnit);
    const to = units.find(u => u.value === toUnit);
    if (!from || !to) return '';
    return formatNumber(to.fromBase(from.toBase(value)));
  }, [fromValue, fromUnit, toUnit, units]);

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    setFromUnit(defaultUnits[newCategory].from);
    setToUnit(defaultUnits[newCategory].to);
    setFromValue('1');
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result) setFromValue(result);
  };

  const fromLabel = units.find(u => u.value === fromUnit)?.label.split(' (')[0] || '';
  const toLabel = units.find(u => u.value === toUnit)?.label.split(' (')[0] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Category */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
          Category
        </label>
        <Select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as UnitCategory)}
          options={unitCategories}
        />
      </div>

      {/* From Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            From
          </label>
          <Input
            type="number"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            placeholder="Enter value"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            options={units.map(u => ({ value: u.value, label: u.label }))}
          />
        </div>
      </div>

      {/* Swap Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px', marginBottom: '-20px' }}>
        <button
          onClick={swapUnits}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          title="Swap units"
        >
          <ArrowLeftRight size={14} />
        </button>
      </div>

      {/* To Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            To
          </label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--link)',
              height: 'var(--button-height)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {result || '—'}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            options={units.map(u => ({ value: u.value, label: u.label }))}
          />
        </div>
      </div>

      {/* Conversion Summary */}
      {fromValue && result && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          {fromValue} {fromLabel} = {result} {toLabel}
        </div>
      )}
    </div>
  );
}
