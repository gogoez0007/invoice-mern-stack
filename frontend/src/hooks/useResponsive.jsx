import { useEffect, useState } from 'react';
import isBrowser from '@/utils/isBrowser';

const subscribers = new Set();
let info = {}; // Initialize info here to avoid undefined issues
let responsiveConfig = {
  xs: 0,
  sm: 576,
  isMobile: 768,
  md: 768,
  lg: 992,
  xl: 1200,
};

function handleResize() {
  if (!isBrowser) return; // Add check for browser environment

  const oldInfo = { ...info }; // Create a copy for comparison
  calculate();

  // Deep comparison of objects
  if (JSON.stringify(oldInfo) === JSON.stringify(info)) return;

  for (const subscriber of subscribers) {
    subscriber();
  }
}

let listening = false;

function calculate() {
  if (!isBrowser) return; // Add check for browser environment

  const width = window.innerWidth;
  const newInfo = {};

  for (const key of Object.keys(responsiveConfig)) {
    newInfo[key] = width >= responsiveConfig[key];
  }

  info = newInfo; // Update info directly
}

export function configResponsive(config) {
  responsiveConfig = config;
  if (info) calculate();
}

export default function useResponsive() {
  const [state, setState] = useState(() => { // Use a function to initialize state
    if (isBrowser) {
      calculate(); // Initial calculation
      return { ...info }; // Return a copy of info
    }
    return {}; // Return an empty object if not in browser
  });

  useEffect(() => {
    if (!isBrowser) return;

    if (!listening) {
      window.addEventListener('resize', handleResize);
      listening = true;
    }

    const subscriber = () => {
      setState({ ...info }); // Update state with a copy of info
    };

    subscribers.add(subscriber);

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        window.removeEventListener('resize', handleResize);
        listening = false;
      }
    };
  }, []);

  return { screenSize: state, isMobile: !state.md };
}