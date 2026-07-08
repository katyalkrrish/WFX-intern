import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search, SlidersHorizontal, ArrowUpDown, Loader, RefreshCw } from "lucide-react";

export default function ProductSearch() {
  // Filters metadata
  const [filterMetadata, setFilterMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Search state
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFabric, setSelectedFabric] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedPrint, setSelectedPrint] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [gsmMin, setGsmMin] = useState(0);
  const [gsmMax, setGsmMax] = useState(500);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);

  // Sorting / Results
  const [sortField, setSortField] = useState("style_number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [products, setProducts] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  // Load filter values from DB on mount
  useEffect(() => {
    axios
      .get("http://localhost:3000/products/filters")
      .then((res) => {
        setFilterMetadata(res.data);
        setGsmMin(res.data.ranges.minGsm);
        setGsmMax(res.data.ranges.maxGsm);
        setPriceMin(res.data.ranges.minPrice);
        setPriceMax(res.data.ranges.maxPrice);
        setLoadingMetadata(false);
      })
      .catch((err) => {
        console.error("Error fetching filters:", err);
        setLoadingMetadata(false);
      });
  }, []);

  // Fetch products based on search criteria
  const fetchProducts = useCallback(() => {
    setLoadingResults(true);
    const params = {
      q: query || undefined,
      category: selectedCategory || undefined,
      fabric: selectedFabric || undefined,
      color: selectedColor || undefined,
      print: selectedPrint || undefined,
      season: selectedSeason || undefined,
      supplier: selectedSupplier || undefined,
      gsm_min: gsmMin || undefined,
      gsm_max: gsmMax || undefined,
      price_min: priceMin || undefined,
      price_max: priceMax || undefined,
      sort: sortField,
      order: sortOrder,
      page,
      limit: 9
    };

    axios
      .get("http://localhost:3000/products/search", { params })
      .then((res) => {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
        setLoadingResults(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoadingResults(false);
      });
  }, [
    query,
    selectedCategory,
    selectedFabric,
    selectedColor,
    selectedPrint,
    selectedSeason,
    selectedSupplier,
    gsmMin,
    gsmMax,
    priceMin,
    priceMax,
    sortField,
    sortOrder,
    page
  ]);

  // Trigger search on filter changes (debounced query if needed, or simple direct fetch)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReset = () => {
    setQuery("");
    setSelectedCategory("");
    setSelectedFabric("");
    setSelectedColor("");
    setSelectedPrint("");
    setSelectedSeason("");
    setSelectedSupplier("");
    if (filterMetadata) {
      setGsmMin(filterMetadata.ranges.minGsm);
      setGsmMax(filterMetadata.ranges.maxGsm);
      setPriceMin(filterMetadata.ranges.minPrice);
      setPriceMax(filterMetadata.ranges.maxPrice);
    }
    setSortField("style_number");
    setSortOrder("asc");
    setPage(1);
  };

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  return (
    <div className="product-search-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <h1>Product Advanced Search</h1>
          <p className="subtitle">Search using natural language or combine structured filters to explore the finished goods catalog.</p>
        </div>
      </header>

      <div className="search-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar animate-fade-in">
          <div className="filters-header">
            <h3>
              <SlidersHorizontal size={18} /> Filters
            </h3>
            <button className="btn-reset" onClick={handleReset}>
              <RefreshCw size={14} /> Reset
            </button>
          </div>

          {loadingMetadata ? (
            <div className="filters-loading">
              <Loader className="spinner" size={20} />
              <span>Loading filters...</span>
            </div>
          ) : (
            <div className="filters-list">
              {/* Keyword Search */}
              <div className="filter-group">
                <label>Keyword</label>
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, code..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  {filterMetadata.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fabric */}
              <div className="filter-group">
                <label>Fabric</label>
                <select
                  value={selectedFabric}
                  onChange={(e) => {
                    setSelectedFabric(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Fabrics</option>
                  {filterMetadata.fabrics.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div className="filter-group">
                <label>Color</label>
                <select
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Colors</option>
                  {filterMetadata.colors.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print */}
              <div className="filter-group">
                <label>Print/Pattern</label>
                <select
                  value={selectedPrint}
                  onChange={(e) => {
                    setSelectedPrint(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Prints</option>
                  {filterMetadata.prints.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div className="filter-group">
                <label>Season</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Seasons</option>
                  {filterMetadata.seasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div className="filter-group">
                <label>Supplier</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => {
                    setSelectedSupplier(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Suppliers</option>
                  {filterMetadata.suppliers.map((sup) => (
                    <option key={sup} value={sup}>
                      {sup}
                    </option>
                  ))}
                </select>
              </div>

              {/* GSM Sliders */}
              <div className="filter-group">
                <div className="range-labels">
                  <label>GSM Range</label>
                  <span>
                    {gsmMin} - {gsmMax}
                  </span>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min={filterMetadata.ranges.minGsm}
                    max={filterMetadata.ranges.maxGsm}
                    value={gsmMin}
                    onChange={(e) => {
                      setGsmMin(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className="slider-min"
                  />
                  <input
                    type="range"
                    min={filterMetadata.ranges.minGsm}
                    max={filterMetadata.ranges.maxGsm}
                    value={gsmMax}
                    onChange={(e) => {
                      setGsmMax(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className="slider-max"
                  />
                </div>
              </div>

              {/* Price Sliders */}
              <div className="filter-group">
                <div className="range-labels">
                  <label>Price Range</label>
                  <span>
                    ₹{priceMin} - ₹{priceMax}
                  </span>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min={filterMetadata.ranges.minPrice}
                    max={filterMetadata.ranges.maxPrice}
                    value={priceMin}
                    onChange={(e) => {
                      setPriceMin(parseFloat(e.target.value));
                      setPage(1);
                    }}
                  />
                  <input
                    type="range"
                    min={filterMetadata.ranges.minPrice}
                    max={filterMetadata.ranges.maxPrice}
                    value={priceMax}
                    onChange={(e) => {
                      setPriceMax(parseFloat(e.target.value));
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Results Panel */}
        <main className="results-panel animate-fade-in">
          {/* Sorting / Meta Header */}
          <div className="results-meta">
            <span className="results-count">
              Found <strong>{pagination.totalItems || 0}</strong> products
            </span>
            
            <div className="sorting-controls">
              <button
                className={`sort-btn ${sortField === "style_number" ? "active" : ""}`}
                onClick={() => handleSortChange("style_number")}
              >
                Style Code {sortField === "style_number" && (sortOrder === "asc" ? "▲" : "▼")}
              </button>
              <button
                className={`sort-btn ${sortField === "selling_price" ? "active" : ""}`}
                onClick={() => handleSortChange("selling_price")}
              >
                Price {sortField === "selling_price" && (sortOrder === "asc" ? "▲" : "▼")}
              </button>
              <button
                className={`sort-btn ${sortField === "gsm" ? "active" : ""}`}
                onClick={() => handleSortChange("gsm")}
              >
                GSM {sortField === "gsm" && (sortOrder === "asc" ? "▲" : "▼")}
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {loadingResults ? (
            <div className="grid-loading">
              <Loader className="spinner" size={32} />
              <p>Searching catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-results animate-fade-in">
              <h3>No garments found</h3>
              <p>Try resetting the filters or broadening your search terms.</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.style_number} className="product-card animate-slide-up">
                    <div className="product-image-wrapper">
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
                        <div className="image-placeholder">No Image Available</div>
                      )}
                      <span className="product-tag">{product.season}</span>
                    </div>

                    <div className="product-details">
                      <div className="product-meta-header">
                        <span className="product-code">{product.style_number}</span>
                        <span className="product-price">₹{parseFloat(product.selling_price).toFixed(2)}</span>
                      </div>
                      <h4 className="product-title">{product.style_name}</h4>
                      <p className="product-spec">
                        {product.fabric} • {product.gsm} GSM
                      </p>
                      <div className="product-footer-row">
                        <span className="product-supplier">{product.supplier}</span>
                        <span className="product-color-badge" style={{ backgroundColor: product.color.toLowerCase() }} title={product.color}></span>
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
                    Previous
                  </button>
                  <span className="page-indicator">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn-page"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
