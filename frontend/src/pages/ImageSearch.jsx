import React, { useState } from "react";
import apiClient from "../services/apiClient";
import { UploadCloud, Image as ImageIcon, Sparkles, Loader, Search, RefreshCw } from "lucide-react";

export default function ImageSearch() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textQuery, setTextQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [extractedTags, setExtractedTags] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setTextQuery(""); // clear text query if image uploaded
    };
    reader.readAsDataURL(file);
  };

  const executeSearch = async () => {
    if (!imagePreview && !textQuery.trim()) return;

    setLoading(true);
    setResults([]);
    setExtractedTags(null);
    setSearched(true);
    setSearchError(null);

    try {
      let payload = {};
      if (imagePreview) {
        setLoadingStep("Processing image...");
        const commaIndex = imagePreview.indexOf(",");
        const base64Data = imagePreview.substring(commaIndex + 1);
        const mimeType = imagePreview.match(/data:(.*);base64/)[1];
        setLoadingStep("Searching products...");
        payload = {
          image: base64Data,
          mimeType: mimeType
        };
      } else {
        setLoadingStep("Searching products...");
        payload = {
          q: textQuery
        };
      }

      const response = await apiClient.post("/ai/image-search", payload);
      setExtractedTags(response.data.tags);
      setResults(response.data.data);

    } catch (err) {
      console.error("AI Image Search failed:", err);
      setSearchError(err.response?.data?.message || err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
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
          <h1>AI Similarity & Image Search</h1>
          <p className="subtitle">Upload a garment photo or type a visual description. The AI tags the visual details and matches similar styles in our catalog.</p>
        </div>
      </header>

      {/* Input panel: upload or text */}
      <section className="search-control-panel animate-slide-up">
        <div className="search-split">
          {/* Upload card */}
          <div 
            className={`upload-zone ${dragActive ? "drag-active" : ""} ${imagePreview ? "has-preview" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Upload preview" />
                <button className="remove-preview-btn" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                  Remove Image
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <UploadCloud size={48} className="upload-icon" />
                <h4>Drag & Drop Garment Photo</h4>
                <p>or click to browse from files</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>

          <div className="divider-or">
            <span>OR</span>
          </div>

          {/* Text Description Box */}
          <div className="text-query-box">
            <h4>Type a Visual Description</h4>
            <p>Describe patterns, fabrics, and colors</p>
            <div className="search-input-container">
              <textarea
                placeholder="e.g. A blue striped cotton polo t-shirt with short sleeves..."
                value={textQuery}
                onChange={(e) => {
                  setTextQuery(e.target.value);
                  setImageFile(null);
                  setImagePreview(null); // clear image if text typed
                }}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="search-actions">
          <button
            className="btn-primary"
            onClick={executeSearch}
            disabled={loading || (!imagePreview && !textQuery.trim())}
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
      </section>

      {/* Loading Steps Panel */}
      {loading && (
        <div className="search-steps animate-fade-in">
          <Loader className="spinner" size={24} />
          <h4>{loadingStep}</h4>
        </div>
      )}

      {/* Inline Error */}
      {searchError && !loading && (
        <div className="inline-search-error animate-fade-in">
          <span>⚠ {searchError}</span>
        </div>
      )}

      {/* Results grid */}
      {searched && !loading && !searchError && (
        <section className="search-results-section animate-fade-in">
          {/* Extracted tags list */}
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

          {/* Matching Products Grid */}
          <div className="results-header-row">
            <h3>Visually Similar Matches ({results.length} items found)</h3>
          </div>

          {results.length === 0 ? (
            <div className="no-results-box animate-fade-in">
              <h4>No matches found</h4>
              <p>We couldn't find any products matching those tags. Try another image or description.</p>
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
                    {product.match_score && (
                      <span className="match-score-badge">Match Score: {product.match_score}</span>
                    )}
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
          )}
        </section>
      )}
    </div>
  );
}
