import { useProcessingIndicator } from "../hooks/use-processing-indicator";

const ProcessingIndicator = () => {
  const processingIndicator = useProcessingIndicator();

  return processingIndicator.isShowing ? (
    <div>
      <div className="fixed inset-0 z-50 bg-indigo-600 opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-20 mx-auto overflow-y-auto bg-indigo-600 rounded shadow-lg sm:max-w-sm">
          <div className="p-6">
            <div
              style={{ borderTopColor: "white" }}
              className={`loader ease-linear rounded-full border-4 border-t-4 border-gray-900 border-opacity-50 h-8`}
            />
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default ProcessingIndicator;
