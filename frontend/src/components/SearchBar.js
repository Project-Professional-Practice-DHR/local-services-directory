import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import '../styles/SearchBar.css';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search anything...", 
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch?.(newQuery);
  };

  const handleSearch = () => {
    onSearch?.(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="services-hub-search-container">
      <div className="services-hub-search-wrapper">
        <div className="services-hub-search-icon">
          <Search className="services-hub-icon" />
        </div>

        <input 
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="services-hub-search-input"
        />

        <button 
          className="services-hub-search-button"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchBar;