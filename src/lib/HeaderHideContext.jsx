import React, { createContext, useState, useContext } from 'react';

const HeaderHideContext = createContext();

export function HeaderHideProvider({ children }) {
  const [hideHeader, setHideHeader] = useState(false);
  // True while the user is actively scrolling (chrome auto-hides). Shared so
  // the reader toolbar can hide in sync with the app header + bottom nav.
  const [chromeHidden, setChromeHidden] = useState(false);

  return (
    <HeaderHideContext.Provider value={{ hideHeader, setHideHeader, chromeHidden, setChromeHidden }}>
      {children}
    </HeaderHideContext.Provider>
  );
}

export function useHeaderHide() {
  const context = useContext(HeaderHideContext);
  if (!context) {
    throw new Error('useHeaderHide must be used within HeaderHideProvider');
  }
  return context;
}