import React from 'react';

interface SlidePreviewProps {
  slideContent: string[][];
  slideCount: number;
  currentSlide: number;
  onSlideChange: (slide: number) => void;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slideContent,
  slideCount,
  currentSlide,
  onSlideChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Slide Preview</h3>
      
      {slideContent.length > 0 ? (
        <>
          <div className="bg-gray-100 rounded-lg p-8 mb-4" style={{ aspectRatio: '16/9' }}>
            <div className="bg-white h-full rounded shadow-lg p-6 overflow-auto">
              <table className="w-full text-sm">
                <tbody>
                  {slideContent.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? 'font-bold' : ''}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-300 px-2 py-1"
                        >
                          {cell || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {slideCount > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Slide {currentSlide + 1} of {slideCount}
              </span>
              <button
                onClick={() => onSlideChange(Math.min(slideCount - 1, currentSlide + 1))}
                disabled={currentSlide === slideCount - 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <p className="text-gray-500">Select a table to preview</p>
        </div>
      )}
    </div>
  );
};