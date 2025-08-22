import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}
export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 300
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0
  });
  const childRef = useRef<HTMLDivElement>(null);
  // Function to calculate tooltip position
  const updateTooltipPosition = () => {
    if (!childRef.current) return;
    const rect = childRef.current.getBoundingClientRect();
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    let top = 0;
    let left = 0;
    switch (position) {
      case 'top':
        top = rect.top + scrollTop - 8;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + 8;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 8;
        break;
      case 'right':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 8;
        break;
    }
    setTooltipPosition({
      top,
      left
    });
  };
  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
      // Update position when showing
      updateTooltipPosition();
    }, delay);
    setTimeoutId(id);
  };
  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };
  // Update position on window resize
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => updateTooltipPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isVisible]);
  // Calculate tooltip styles based on position
  const getTooltipStyles = () => {
    const baseStyles = {
      position: 'absolute',
      zIndex: 1000
    } as React.CSSProperties;
    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          ...baseStyles,
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          ...baseStyles,
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(0, -50%)'
        };
    }
  };
  // Calculate arrow styles based on position
  const getArrowStyles = () => {
    const baseStyles = {
      position: 'absolute'
    } as React.CSSProperties;
    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '4px',
          borderStyle: 'solid',
          borderColor: 'rgb(55, 65, 81) transparent transparent transparent'
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '4px',
          borderStyle: 'solid',
          borderColor: 'transparent transparent rgb(55, 65, 81) transparent'
        };
      case 'left':
        return {
          ...baseStyles,
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '4px',
          borderStyle: 'solid',
          borderColor: 'transparent transparent transparent rgb(55, 65, 81)'
        };
      case 'right':
        return {
          ...baseStyles,
          left: '-4px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '4px',
          borderStyle: 'solid',
          borderColor: 'transparent rgb(55, 65, 81) transparent transparent'
        };
    }
  };
  // Create portal for the tooltip
  const tooltipPortal = isVisible ? createPortal(<div style={getTooltipStyles()} className="px-2 py-1 text-xs font-medium text-white bg-gray-700 rounded shadow-sm whitespace-nowrap" role="tooltip">
          {content}
          <div style={getArrowStyles()}></div>
        </div>, document.body) : null;
  return <div ref={childRef} className="inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip}>
      {children}
      {tooltipPortal}
    </div>;
}