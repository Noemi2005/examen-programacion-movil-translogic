import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border border-[#D5DAE6] text-xs font-mono">
      <div className="text-[#5B6480]">
        Mostrando <span className="font-bold text-[#13235B]">{startItem}</span> -{' '}
        <span className="font-bold text-[#13235B]">{endItem}</span> de{' '}
        <span className="font-bold text-[#13235B]">{totalItems}</span> registros
      </div>

      <div className="flex items-center space-x-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2.5 border border-[#D5DAE6] bg-white text-[#13235B] hover:bg-[#F3F5FA] disabled:opacity-40 disabled:pointer-events-none font-bold flex items-center transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          <span>ANTERIOR</span>
        </button>

        {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 border font-bold transition-colors ${
              currentPage === pageNum
                ? 'bg-[#13235B] border-[#13235B] text-white'
                : 'bg-white border-[#D5DAE6] text-[#13235B] hover:bg-[#F3F5FA]'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage >= Math.max(1, totalPages)}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2.5 border border-[#D5DAE6] bg-white text-[#13235B] hover:bg-[#F3F5FA] disabled:opacity-40 disabled:pointer-events-none font-bold flex items-center transition-colors"
        >
          <span>SIGUIENTE</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>
  );
};

