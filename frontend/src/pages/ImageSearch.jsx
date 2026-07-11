import React, { useState } from "react";
import apiClient from "../services/apiClient";
import { Sparkles, Loader, Search, RefreshCw } from "lucide-react";

export default function ImageSearch() {
  const [textQuery, setTextQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedTags, setExtractedTags] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const executeSearch = async () => {
    if (!textQuery.trim()) return;

    setLoading(true);
    setResults([]);
    setExtractedTags(null);
    setSearched(true);
    setSearchError(null);

    try {
      const response = await apiClient.post("/search-image", { q: textQuery });
      setExtractedTags(response.data.tags);
      setResults(response.data.data);
    } catch (err) {
      console.error("AI Search failed:", err);
      setSearchError(err.response?.data?.message || err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTextQuery("");
    setResults([]);
    setExtractedTags(null);
    setSearched(false);
    setSearchError(null);
  };

  return (
    <div className="image-search-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <h1>AI Similarity Search</h1>
          <p className="subtitle">Describe a garment using colors, fabrics, or patterns. The AI finds visually similar products from the catalog.</p>
        </div>
      </header>

      {/* Text Search Panel */}
      <section className="search-control-panel animate-slide-up">
        <div className="text-search-full">
          <label className="text-search-label">
            <Search size={18} />
            <span>Describe what you're looking for</span>
          </label>
          <div className="text-search-row">
            <textarea
              className="text-search-textarea"
              placeholder="e.g. blue striped cotton shirt, red floral summer dress, black denim jacket..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  executeSearch();
                }
              }}
              rows={3}
            />
          </div>

          <div className="search-actions">
            <button
              className="btn-primary"
              onClick={executeSearch}
              disabled={loading || !textQuery.trim()}
            >
              {loading ? (
                <>
                  <Loader className="spinner" size={18} />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Search Similar Garments</span>
                </>
              )}
            </button>
            {searched && (
              <button className="btn-secondary" onClick={handleReset} disabled={loading}>
                <RefreshCw size={16} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="search-steps animate-fade-in">
          <Loader className="spinner" size={24} />
          <h4>Searching products...</h4>
        </div>
      )}

      {/* Inline Error */}
      {searchError && !loading && (
        <div className="inline-search-error animate-fade-in">
          <span>⚠ {searchError}</span>
        </div>
      )}

      {/* Results */}
      {searched && !loading && !searchError && (
        <section className="search-results-section animate-fade-in">
          {/* Extracted Tags */}
          {extractedTags && (
            <div className="tags-card animate-slide-up">
              <div className="tags-header">
                <Sparkles size={16} className="text-purple" />
                <h4>AI Extracted Visual Tags</h4>
              </div>
              <div className="tags-grid">
                {extractedTags.category && (
                  <div className="tag-pill">
                    <span className="tag-key">Category</span>
                    <span className="tag-val">{extractedTags.category}</span>
                  </div>
                )}
                {extractedTags.color && (
                  <div className="tag-pill">
                    <span className="tag-key">Color</span>
                    <span className="tag-val">{extractedTags.color}</span>
                  </div>
                )}
                {extractedTags.fabric && (
                  <div className="tag-pill">
                    <span className="tag-key">Fabric</span>
                    <span className="tag-val">{extractedTags.fabric}</span>
                  </div>
                )}
                {extractedTags.print && (
                  <div className="tag-pill">
                    <span className="tag-key">Print</span>
                    <span className="tag-val">{extractedTags.print}</span>
                  </div>
                )}
                {extractedTags.keywords && (
                  <div className="tag-pill">
                    <span className="tag-key">Keywords</span>
                    <span className="tag-val">{extractedTags.keywords}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="results-header-row">
            <h3>Similar Matches ({results.length} items found)</h3>
          </div>

          {results.length === 0 ? (
            <div className="no-results animate-fade-in">
              <h3>No matches found</h3>
              <p>Try a different description — e.g. include color, fabric, or pattern details.</p>
            </div>
          ) : (
            <div className="products-grid">
              {results.map((product) => (
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
                    {product.season && <span className="product-tag">{product.season}</span>}
                  </div>

                  <div className="product-details">
                    <div className="product-meta-header">
                      <span className="product-code">{product.style_number}</span>
                      <span className="product-price">₹{parseFloat(product.selling_price).toFixed(2)}</span>
                    </div>
                    <h4 className="product-title">{product.style_name}</h4>
                    <p className="product-spec">{product.fabric} • {product.gsm} GSM</p>
                    <div className="product-footer-row">
                      <span className="product-supplier">{product.supplier}</span>
                      <span
                        className="product-color-badge"
                        style={{ backgroundColor: product.color?.toLowerCase() }}
                        title={product.color}
                      ></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
