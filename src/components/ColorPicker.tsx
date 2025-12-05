import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ColorPickerProps {
  label: string;
  value: string; // HSL format: "142 76% 36%"
  onChange: (value: string) => void;
  description?: string;
}

// Convert HSL string "142 76% 36%" to hex
const hslToHex = (hsl: string): string => {
  const parts = hsl.trim().split(/\s+/);
  const h = parseFloat(parts[0]) || 0; // hue
  const s = parseFloat(parts[1]?.replace('%', '') || '0') / 100; // saturation (0-1)
  const l = parseFloat(parts[2]?.replace('%', '') || '0') / 100; // lightness (0-1)

  const hNorm = h / 360;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Convert hex to HSL string "142 76% 36%"
const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  if (hex.length !== 6) {
    return '142 76% 36%'; // Return default if invalid
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description }) => {
  const hexValue = hslToHex(value);
  const [hexInput, setHexInput] = React.useState(hexValue);

  React.useEffect(() => {
    setHexInput(hslToHex(value));
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setHexInput(newHex);
    
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      onChange(hexToHsl(newHex));
    }
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setHexInput(newHex);
    onChange(hexToHsl(newHex));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`color-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorInputChange}
            className="w-12 h-10 rounded-md border border-border cursor-pointer"
            style={{ backgroundColor: hexValue }}
          />
        </div>
        <Input
          id={`color-${label}`}
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
          maxLength={7}
        />
        <Card className="p-2 border" style={{ backgroundColor: `hsl(${value})` }}>
          <div className="w-8 h-8 rounded" />
        </Card>
      </div>
    </div>
  );
};

