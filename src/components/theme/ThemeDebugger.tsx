import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Palette } from 'lucide-react';

export function ThemeDebugger() {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-black text-white rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        title="Show Theme Debug"
      >
        <Palette className="w-5 h-5" />
      </button>
    );
  }

  const getComputedVar = (varName: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  };

  const themeVars = [
    { name: 'Primary', var: '--theme-primary' },
    { name: 'Secondary', var: '--theme-secondary' },
    { name: 'Accent', var: '--theme-accent' },
    { name: 'Background', var: '--theme-background' },
    { name: 'Surface', var: '--theme-surface' },
    { name: 'Text', var: '--theme-text' },
    { name: 'Border', var: '--theme-border' },
  ];

  return (
    <div className="theme-debug">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Theme Debug
        </h3>
        <button onClick={() => setIsOpen(false)} className="hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-2">
        <strong>Active Theme:</strong> {currentTheme?.name || 'None'}
      </div>

      <div className="space-y-1">
        {themeVars.map(({ name, var: varName }) => {
          const value = getComputedVar(varName);
          return (
            <div key={varName} className="theme-debug-item">
              <span>{name}:</span>
              <div className="flex items-center gap-2">
                <div
                  className="theme-debug-color"
                  style={{ backgroundColor: value }}
                />
                <span className="text-xs opacity-75">{value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 text-xs opacity-75">
        Press F12 → Console for detailed logs
      </div>
    </div>
  );
}
