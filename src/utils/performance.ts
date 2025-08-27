// V2.0 Performance Monitoring and Optimization Utils
import { useCallback, useEffect, useRef, useState } from 'react';

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private observers = new Map<string, PerformanceObserver>();

  // Measure function execution time
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric(name, end - start);
    console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    
    return result;
  }

  // Measure async function execution time
  async measureAsyncTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.recordMetric(name, end - start);
    console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    
    return result;
  }

  // Record custom metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get metric statistics
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return {
      count: values.length,
      avg: Number(avg.toFixed(2)),
      median: Number(median.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      min: Number(sorted[0].toFixed(2)),
      max: Number(sorted[sorted.length - 1].toFixed(2))
    };
  }

  // Monitor largest contentful paint
  observeLCP(): void {
    if (typeof window === 'undefined') return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.set('lcp', observer);
  }

  // Monitor first input delay
  observeFID(): void {
    if (typeof window === 'undefined') return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        // Type assertion for FID entry
        const fidEntry = entry as any;
        const fid = fidEntry.processingStart - fidEntry.startTime;
        console.log(`📊 FID: ${fid.toFixed(2)}ms`);
      });
    });
    
    observer.observe({ type: 'first-input', buffered: true });
    this.observers.set('fid', observer);
  }

  // Get all metrics summary
  getAllMetrics() {
    const summary: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      summary[name] = this.getMetricStats(name);
    }
    
    return summary;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const mountTime = useRef<number>();

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      if (mountTime.current) {
        const unmountTime = performance.now();
        performanceMonitor.recordMetric(
          `${componentName}-lifetime`,
          unmountTime - mountTime.current
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current++;
    performanceMonitor.recordMetric(`${componentName}-renders`, renderCount.current);
  });

  const measureRender = useCallback((fn: () => void) => {
    performanceMonitor.measureTime(`${componentName}-render`, fn);
  }, [componentName]);

  return {
    measureRender,
    renderCount: renderCount.current
  };
};

// Debounce hook for performance optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for performance optimization  
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
    };
  }
  return null;
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;
  
  const scripts = Array.from(document.scripts);
  let totalSize = 0;
  
  scripts.forEach(script => {
    if (script.src) {
      // This is a simplified estimation
      totalSize += script.src.length;
    }
  });
  
  console.log(`📦 Estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
  return totalSize;
};
