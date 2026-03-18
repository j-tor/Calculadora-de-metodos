import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MethodSidebar } from './components/MethodSidebar';
import { TopBar } from './components/TopBar';
import { MathInputPanel } from './components/MathInputPanel';
import { ParametersPanel } from './components/ParametersPanel';
import { DynamicResultsPanel } from './components/DynamicResultsPanel';
import { GraphPanel } from './components/GraphPanel';
import { VoiceCommandDialog } from './components/VoiceCommandDialog';

function AppContent() {
  const [selectedMethod, setSelectedMethod] = useState('newton');
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCalculate = async () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const endpoint = `${apiBase}/api/calculator/calculate`;
    const payload: Record<string, any> = { method: selectedMethod };

    if (mathInput.trim() !== '') {
      payload.equation = mathInput.trim();
    }

    Object.entries(paramValues).forEach(([key, value]) => {
      if (value === '') return;
      if (key === 'matrixA' || key === 'vectorB' || key === 'matrix_type') {
        payload[key] = value;
        return;
      }
      if (key === 'x_values_str' || key === 'y_values_str') {
        const parts = value.split(',').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        const newKey = key === 'x_values_str' ? 'x_values' : 'y_values';
        payload[newKey] = parts;
        return;
      }
      const num = Number(value);
      payload[key] = Number.isFinite(num) ? num : value;
    });

    try {
      setIsLoading(true);
      setApiError(null);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail || 'Error en la solicitud');
      }
      const data = await response.json();
      setApiResult(data);
      setHasResults(true);
    } catch (error: any) {
      setApiResult(null);
      setHasResults(false);
      setApiError(error?.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleVoiceCommand = () => {
    setIsVoiceDialogOpen(true);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const bgPrimary = isDark ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]';
  const bgOverlay = isDark
    ? 'bg-gradient-to-br from-[#0F172A] via-[#0F172A]/95 to-[#1E293B]/80'
    : 'bg-gradient-to-br from-[#F8FAFC] via-[#F8FAFC]/95 to-[#E2E8F0]/50';
  const gridColor = isDark ? '#3B82F6' : '#CBD5E1';
  const dotColor = isDark ? '#22D3EE' : '#0891B2';
  const gridOpacity = isDark ? 0.03 : 0.02;

  return (
    <div className={`min-h-screen ${bgPrimary} flex overflow-hidden relative`}>
      {/* Mathematical Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: gridOpacity }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridColor} strokeWidth="0.5" />
            </pattern>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill={dotColor} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Gradient Overlay for depth */}
      <div className={`absolute inset-0 ${bgOverlay} pointer-events-none`}></div>

      {/* Main Content */}
      <div className="relative z-10 flex w-full">
        {/* Left Sidebar */}
        <MethodSidebar
          selectedMethod={selectedMethod}
          onMethodSelect={setSelectedMethod}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <TopBar
            onVoiceCommand={handleVoiceCommand}
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Content Grid */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[2000px] mx-auto space-y-6">
              {/* Top Row - Math Input and Parameters */}
              <div className="grid grid-cols-12 gap-6">
                {/* Math Input - Takes 8 columns */}
                <div className="col-span-8">
                  <MathInputPanel
                    selectedMethod={selectedMethod}
                    value={mathInput}
                    onChange={setMathInput}
                  />
                </div>

                {/* Parameters Panel - Takes 4 columns */}
                <div className="col-span-4">
                  <ParametersPanel
                    selectedMethod={selectedMethod}
                    onCalculate={handleCalculate}
                    values={paramValues}
                    onValueChange={handleParamChange}
                  />
                </div>
              </div>

              {/* Results Section */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-0.5 flex-1 bg-gradient-to-r from-transparent ${isDark ? 'via-[#334155]' : 'via-[#CBD5E1]'} to-transparent`}></div>
                  <h2 className={`text-sm font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#64748B]'} uppercase tracking-wider`}>Resultados</h2>
                  <div className={`h-0.5 flex-1 bg-gradient-to-r from-transparent ${isDark ? 'via-[#334155]' : 'via-[#CBD5E1]'} to-transparent`}></div>
                </div>
                <DynamicResultsPanel
                  selectedMethod={selectedMethod}
                  hasResults={hasResults}
                  apiResult={apiResult}
                  apiError={apiError}
                  isLoading={isLoading}
                />
              </div>

              {/* Graph Visualization */}
              <div>
                <GraphPanel hasResults={hasResults} apiResult={apiResult} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Command Dialog */}
      <VoiceCommandDialog
        isOpen={isVoiceDialogOpen}
        onClose={() => setIsVoiceDialogOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
