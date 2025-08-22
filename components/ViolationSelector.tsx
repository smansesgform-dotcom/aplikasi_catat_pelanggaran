import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Violation } from '../types';

interface ViolationSelectorProps {
  allViolations: Violation[];
  selectedViolations: Violation[];
  onSelectedViolationsChange: (violations: Violation[]) => void;
}

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ViolationSelector: React.FC<ViolationSelectorProps> = ({ allViolations, selectedViolations, onSelectedViolationsChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Violation[]>([]);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([]);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = allViolations.filter(
      (violation) =>
        violation.name.toLowerCase().includes(lowerCaseQuery) &&
        !selectedViolations.some((v) => v.id === violation.id)
    );
    setResults(filtered);
  }, [allViolations, selectedViolations]);

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectViolation = (violation: Violation) => {
    onSelectedViolationsChange([...selectedViolations, violation]);
    setQuery('');
    setResults([]);
    setDropdownVisible(false);
  };

  const handleRemoveViolation = (violationId: number) => {
    onSelectedViolationsChange(selectedViolations.filter((v) => v.id !== violationId));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor="violation-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Jenis Pelanggaran
      </label>
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {selectedViolations.map((violation) => (
          <span key={violation.id} className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-1 rounded-full">
            {violation.name} ({violation.points} poin)
            <button
              type="button"
              onClick={() => handleRemoveViolation(violation.id)}
              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </span>
        ))}
        <input
          id="violation-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
          className="flex-grow bg-transparent border-none focus:ring-0 p-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Ketik untuk mencari pelanggaran..."
        />
      </div>
      {isDropdownVisible && (query.length > 0 || results.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 && query.length > 0 && (
            <div className="p-3 text-sm text-gray-500">Pelanggaran tidak ditemukan.</div>
          )}
          {results.length > 0 && (
            <ul>
              {results.map((violation) => (
                <li
                  key={violation.id}
                  onClick={() => handleSelectViolation(violation)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <div className="font-semibold">{violation.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Poin: {violation.points}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ViolationSelector;
