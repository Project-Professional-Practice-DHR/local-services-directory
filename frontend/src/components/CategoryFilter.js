import { useState } from 'react';

const CategoryFilter = ({ categories, onFilter }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  const handleClick = (category) => {
    setActiveCategory(category);
    onFilter(category);
  };

  return (
    <div className="category-filter">
      <button 
        onClick={() => handleClick(null)}
        className={`category-button ${!activeCategory ? 'active' : ''}`}
      >
        All
      </button>
      {categories.map(category => (
        <button 
          key={category}
          onClick={() => handleClick(category)}
          className={`category-button ${activeCategory === category ? 'active' : ''}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
