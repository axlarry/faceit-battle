// V2.0 Lazy Loading Wrapper for better code splitting
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string;
}

const DefaultFallback = ({ height = "200px" }: { height?: string }) => (
  <div className="space-y-4" style={{ minHeight: height }}>
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const LazyWrapper = React.memo(({ 
  children, 
  fallback, 
  height 
}: LazyWrapperProps) => (
  <Suspense fallback={fallback || <DefaultFallback height={height} />}>
    {children}
  </Suspense>
));

LazyWrapper.displayName = 'LazyWrapper';

// Higher-order component for lazy loading
export function withLazy<P extends object>(
  Component: React.ComponentType<P>,
  fallbackHeight?: string
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return React.memo((props: P) => (
    <LazyWrapper height={fallbackHeight}>
      <LazyComponent {...props as any} />
    </LazyWrapper>
  ));
}