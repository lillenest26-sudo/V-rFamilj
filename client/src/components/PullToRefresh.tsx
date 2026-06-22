import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  maxPullDistance?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 150,
}) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const scrollPositionRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Only start pull-to-refresh if scrolled to top
    if (container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      scrollPositionRef.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    // Only allow pull if at top of scroll
    if (container.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);

    // Limit pull distance
    const limitedDistance = Math.min(distance, maxPullDistance);
    setPullDistance(limitedDistance);

    // Prevent default scrolling while pulling
    if (distance > 0) {
      e.preventDefault();
    }
  }, [startY, isRefreshing, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to top
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const pullPercentage = Math.min((pullDistance / threshold) * 100, 100);
  const isReadyToRefresh = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="sticky top-0 left-0 right-0 flex items-center justify-center overflow-hidden bg-background transition-all duration-300 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {isRefreshing ? (
            <>
              <Spinner className="h-5 w-5" />
              <span className="text-xs text-muted-foreground">
                {language === 'sv' ? 'Uppdaterar...' : 'Cusboonaya...'}
              </span>
            </>
          ) : (
            <>
              <div
                className="transition-transform duration-300"
                style={{
                  transform: `rotate(${Math.min(pullPercentage * 3.6, 360)}deg)`,
                }}
              >
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <span className="text-xs text-muted-foreground">
                {isReadyToRefresh 
                  ? (language === 'sv' ? 'Släpp för att uppdatera' : 'Daah si loo cusboonaysiiso')
                  : (language === 'sv' ? 'Dra för att uppdatera' : 'Jiid si loo cusboonaysiiso')
                }
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        className="transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
