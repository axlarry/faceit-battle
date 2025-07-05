import React from 'react';

interface TrendIndicatorProps {
  trend?: string;
  report?: string; // Adăugăm report pentru a calcula trendul din datele reale
}

const getTrendFromReport = (report?: string): string => {
  if (!report) return '';
  
  // Parse raportul lcrypt pentru a extrage rezultatele
  const matches = report.split(', ');
  const results: string[] = [];
  
  matches.forEach(match => {
    // Parse format: "WIN 13:10 Mirage (+30)" or "LOSE 13:3 Dust II (-14)"
    const regex = /(WIN|LOSE)\s+/;
    const matchResult = match.match(regex);
    
    if (matchResult) {
      const result = matchResult[1];
      results.push(result === 'WIN' ? 'W' : 'L');
    }
  });
  
  // Returnează ultimele 5 rezultate (sau toate dacă sunt mai puține)
  return results.slice(-5).join('');
};

export const TrendIndicator = React.memo(({ trend, report }: TrendIndicatorProps) => {
  // Folosește trendul din datele reale dacă este disponibil raportul
  const actualTrend = report ? getTrendFromReport(report) : trend;
  
  if (!actualTrend) return null;

  return (
    <div className="flex items-center gap-0.5">
      {actualTrend.split('').map((letter, index) => (
        <span
          key={index}
          className={`font-bold text-sm ${
            letter.toLowerCase() === 'w' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {letter}
        </span>
      ))}
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';