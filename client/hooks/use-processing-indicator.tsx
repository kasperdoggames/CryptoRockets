import React, { useState, useContext, createContext } from "react";

export const processingIndicatorContext = createContext({});

export function ProcessingIndicatorProvider({ children }) {
  const processingIndicator = useProcessingIndicatorProvider();
  return (
    <processingIndicatorContext.Provider value={processingIndicator}>
      {children}
    </processingIndicatorContext.Provider>
  );
}

export const useProcessingIndicator = () => {
  return useContext(processingIndicatorContext);
};

const useProcessingIndicatorProvider = () => {
  const [isShowing, setIsShowing] = useState(false);

  const setProcessing = (processing) => {
    console.log(`SHOW: ${processing}`);
    setIsShowing(processing);
  };

  return { setProcessing, isShowing };
};
