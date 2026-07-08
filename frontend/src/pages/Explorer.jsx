import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Loader, X, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function Explorer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering / Sorting / Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [sortField, setSortField] = useState("style_number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1 });
  const limit = 12;

  // Selected product sheet modal details
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [techPack, setTechPack] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch unique categories for dropdown
  useEffect(() => {
    axios
      .get("http://localhost:3000/products/filters")
      .then((res) => {
        setCategories(res.data.categories || []);
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Fetch goods list
  const fetchGoods = useCallback(() => {
    setLoading(true);
    const params = {
      q: searchTerm || undefined,
      category: categoryFilter || undefined,
      sort: sortField,
      order: sortOrder,
      page,
      limit
    };

    axios
      .get("http://localhost:3000/products/search", { params })
      .then((res) => {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading goods list:", err);
        setError("Could not load products. Please check the backend connection.");
        setLoading(false);
      });
  }, [searchTerm, categoryFilter, sortField, sortOrder, page]);

  useEffect(() => {
    fetchGoods();
  }, [fetchGoods]);

  const handleCardClick = async (product) => {
    setSelectedProduct(product);
    setTechPack(null);
    setLoadingDetails(true);

    try {
      const response = await axios.get(`http://localhost:3000/products/${product.style_number}`);
      setTechPack(response.data.techPack);
    } catch (err) {
      console.error("Error loading product details sheet:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setTechPack(null);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    const [field, order] = val.split("-");
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  };

  return (
    <div className="explorer-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <h1>Finished Goods Explorer</h1>
          <p className="subtitle">Catalog list of active garment designs. Click on any card to view its Tech Pack & manufacturing specifications.</p>
        </div>
      </header>

      {/* Toolbar */}
      <section className="explorer-toolbar animate-slide-up">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="Search by code, style, brand..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="search-bar-input"
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="select-filter"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <label>Sort By</label>
          <select onChange={handleSortChange} className="select-sort">
            <option value="style_number-asc">Style Code (A-Z)</option>
            <option value="style_number-desc">Style Code (Z-A)</option>
            <option value="selling_price-asc">Price (Low to High)</option>
            <option value="selling_price-desc">Price (High to Low)</option>
            <option value="gsm-asc">GSM (Lightweight)</option>
            <option value="gsm-desc">GSM (Heavyweight)</option>
          </select>
        </div>
      </section>

      {/* Grid Content */}
      {loading ? (
        <div className="page-loading">
          <Loader className="spinner" size={48} />
          <p>Retrieving catalog inventory...</p>
        </div>
      ) : error ? (
        <div className="page-error">
          <h3>Connection Failed</h3>
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="no-results animate-fade-in">
          <h3>No products match filters</h3>
          <p>Please widen your search query or reset parameters.</p>
        </div>
      ) : (
        <>
          <div className="explorer-grid">
            {products.map((product) => (
              <div
                key={product.style_number}
                className="explorer-card animate-slide-up"
                onClick={() => handleCardClick(product)}
              >
                <div className="explorer-card-image">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.style_name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/300x400/aa3bff/ffffff?text=" + encodeURIComponent(product.style_name);
                      }}
                    />
                  ) : (
                    <div className="image-placeholder">No Image</div>
                  )}
                  <span className="card-badge">{product.season}</span>
                </div>
                <div className="explorer-card-info">
                  <div className="card-top-row">
                    <span className="card-code">{product.style_number}</span>
                    <span className="card-price">₹{parseFloat(product.selling_price).toFixed(2)}</span>
                  </div>
                  <h4 className="card-title">{product.style_name}</h4>
                  <div className="card-divider"></div>
                  <div className="card-footer-row">
                    <div className="card-specs">
                      <span>{product.fabric}</span>
                      <span>•</span>
                      <span>{product.gsm} GSM</span>
                    </div>
                    <span className="card-color-dot" style={{ backgroundColor: product.color.toLowerCase() }}></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-page"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="page-indicator">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-page"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detailed Modal & Tech Pack Drawer */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <X size={20} />
            </button>

            <div className="modal-grid">
              {/* Product Photo */}
              <div className="modal-media">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.style_name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/300x400/aa3bff/ffffff?text=" + encodeURIComponent(selectedProduct.style_name);
                  }}
                />
              </div>

              {/* Specs & Tech Pack details */}
              <div className="modal-details">
                <div className="modal-header">
                  <span className="modal-code">{selectedProduct.style_number}</span>
                  <h2>{selectedProduct.style_name}</h2>
                  <div className="modal-price">Selling Price: ₹{parseFloat(selectedProduct.selling_price).toFixed(2)}</div>
                </div>

                <div className="spec-table">
                  <div className="spec-row">
                    <span className="spec-label">Category</span>
                    <span className="spec-value">{selectedProduct.category}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Fabric Type</span>
                    <span className="spec-value">{selectedProduct.fabric}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Weight (GSM)</span>
                    <span className="spec-value">{selectedProduct.gsm} GSM</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Color / Pattern</span>
                    <span className="spec-value">{selectedProduct.color} / {selectedProduct.print}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Supplier / Brand</span>
                    <span className="spec-value">{selectedProduct.supplier} ({selectedProduct.brand})</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Fabric Cost</span>
                    <span className="spec-value">₹{parseFloat(selectedProduct.cost).toFixed(2)}</span>
                  </div>
                </div>

                {/* Tech Pack Card section */}
                <div className="tech-pack-card">
                  <div className="tech-header">
                    <FileText size={18} />
                    <h4>Tech Pack Specifications</h4>
                  </div>
                  
                  {loadingDetails ? (
                    <div className="tech-loading">
                      <Loader className="spinner" size={16} />
                      <span>Loading specifications...</span>
                    </div>
                  ) : techPack ? (
                    <div className="tech-body">
                      <div className="tech-detail-group">
                        <h5>Fabric details</h5>
                        <p>{techPack.fabric_details || "N/A"}</p>
                      </div>
                      <div className="tech-detail-group">
                        <h5>Construction method</h5>
                        <p>{techPack.construction || "N/A"}</p>
                      </div>
                      <div className="tech-detail-group">
                        <h5>Wash & Care Instructions</h5>
                        <p>{techPack.wash_instructions || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="no-tech-pack">No tech pack registered for this style code.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
