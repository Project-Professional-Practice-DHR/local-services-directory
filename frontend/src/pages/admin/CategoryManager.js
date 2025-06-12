import { useState, useEffect } from 'react';
import '../../styles/CategoryManager.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '',
    parentId: null,
    isActive: true
  });

  // Use relative path instead of environment variable
  const API_BASE = '/api';

  useEffect(() => {
    fetchCategories();
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const url = `${API_BASE}/categories${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching categories from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Categories API Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          return;
        }
        if (response.status === 403) {
          setError('Access denied. Admin permissions required.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Categories data received:', data);
      
      // Handle different response structures
      if (data.success) {
        setCategories(data.categories || data.data || []);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories(data.categories || data.data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(`Failed to load categories: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (!newCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const createdCategory = result.category || result.data || result;
      
      setCategories([...categories, createdCategory]);
      setShowAddModal(false);
      setNewCategory({ name: '', description: '', icon: '', parentId: null, isActive: true });
      setError(null);
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError(`Failed to create category: ${err.message}`);
    }
  };

  const handleUpdateCategory = async (categoryId, updates) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const updatedCategory = result.category || result.data || result;
      
      setCategories(categories.map(cat => 
        cat.id === categoryId ? updatedCategory : cat
      ));
      setEditingCategory(null);
      setError(null);
      
    } catch (err) {
      console.error('Error updating category:', err);
      setError(`Failed to update category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCategories(categories.filter(cat => cat.id !== categoryId));
      setError(null);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(`Failed to delete category: ${err.message}`);
    }
  };

  const handleToggleStatus = async (categoryId, isActive) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/categories/${categoryId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, isActive: !isActive } : cat
      ));
      setError(null);
      
    } catch (err) {
      console.error('Error updating category status:', err);
      setError(`Failed to update category status: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="admin-category-manager">
      {/* Header */}
      <div className="admin-header">
        <h2>Category Manager</h2>
        <button 
          className="admin-btn admin-btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus"></i> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="admin-search-group">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
        <i className="fas fa-search admin-search-icon"></i>
      </div>

      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button 
            className="admin-btn admin-btn-sm" 
            onClick={() => fetchCategories()}
            style={{ marginLeft: '10px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="admin-categories-grid">
        {categories.map(category => (
          <div key={category.id} className="admin-category-card">
            <div className="category-header">
              <div className="category-icon">
                <i className={`fas ${category.icon || 'fa-folder'}`}></i>
              </div>
              <div className="category-actions">
                <button
                  className="admin-btn admin-btn-sm"
                  onClick={() => setEditingCategory(category)}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <h3>{category.name}</h3>
            <p className="category-description">{category.description}</p>
            
            <div className="category-stats">
              <span>Services: {category.serviceCount || 0}</span>
              <span>Providers: {category.providerCount || 0}</span>
            </div>
            
            <div className="category-footer">
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={category.isActive}
                  onChange={() => handleToggleStatus(category.id, category.isActive)}
                />
                <span className="toggle-slider"></span>
                {category.isActive ? 'Active' : 'Inactive'}
              </label>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="admin-empty-state">
          <i className="fas fa-folder-open"></i>
          <p>No categories found</p>
          {searchTerm && (
            <p>Try adjusting your search terms</p>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button
                className="admin-modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setError(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={(e) => {
                    if (editingCategory) {
                      setEditingCategory({...editingCategory, name: e.target.value});
                    } else {
                      setNewCategory({...newCategory, name: e.target.value});
                    }
                  }}
                  className="admin-input"
                  placeholder="Enter category name"
                />
              </div>
              
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={editingCategory ? editingCategory.description : newCategory.description}
                  onChange={(e) => {
                    if (editingCategory) {
                      setEditingCategory({...editingCategory, description: e.target.value});
                    } else {
                      setNewCategory({...newCategory, description: e.target.value});
                    }
                  }}
                  className="admin-textarea"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>
              
              <div className="admin-form-group">
                <label>Icon Class (FontAwesome)</label>
                <input
                  type="text"
                  placeholder="e.g., fa-home, fa-car, fa-tools"
                  value={editingCategory ? editingCategory.icon : newCategory.icon}
                  onChange={(e) => {
                    if (editingCategory) {
                      setEditingCategory({...editingCategory, icon: e.target.value});
                    } else {
                      setNewCategory({...newCategory, icon: e.target.value});
                    }
                  }}
                  className="admin-input"
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={editingCategory ? editingCategory.isActive : newCategory.isActive}
                    onChange={(e) => {
                      if (editingCategory) {
                        setEditingCategory({...editingCategory, isActive: e.target.checked});
                      } else {
                        setNewCategory({...newCategory, isActive: e.target.checked});
                      }
                    }}
                  />
                  Active Category
                </label>
              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  if (editingCategory) {
                    handleUpdateCategory(editingCategory.id, editingCategory);
                  } else {
                    handleCreateCategory();
                  }
                }}
              >
                {editingCategory ? 'Update' : 'Create'} Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;