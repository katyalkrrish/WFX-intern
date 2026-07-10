import { useState } from "react";
import { Send, Copy, Check, Table, Code, Sparkles, Loader } from "lucide-react";
import apiClient from "../services/apiClient";

export default function NLQuery() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  const sampleQueries = [
    "Show shirts under 1000",
    "Show all blue shirts",
    "Show pending orders",
    "Show all suppliers",
    "Show unpaid invoices",
    "Show winter jackets",
  ];

  const handleSend = async (queryText) => {
    const queryToSubmit = queryText || question;
    if (!queryToSubmit.trim()) return;

    setQuestion("");
    setLoading(true);
    setError(null);

    // Add user query to chat history
    const userMessageId = crypto.randomUUID();
    const newUserMessage = {
      id: userMessageId,
      role: "user",
      content: queryToSubmit
    };
    
    setHistory((prev) => [...prev, newUserMessage]);
    setLoadingStep("Generating SQL...");

    const loadingTimer = setTimeout(() => {
      setLoadingStep("Loading results...");
    }, 2000);

    try {
      const response = await apiClient.post("/ai/query", {
        question: queryToSubmit
      });

      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        sql: response.data.generatedSQL,
        rows: response.data.rows,
        summary: response.data.summary
      };

      setHistory((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "error",
        content: err.response?.data?.message || err.message || "Failed to process query"
      };
      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      clearTimeout(loadingTimer);
      setLoading(false);
      setLoadingStep("");
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderTable = (rows) => {
    if (!rows || rows.length === 0) return <p className="no-data">No records returned.</p>;

    const headers = Object.keys(rows[0]);
    return (
      <div className="table-wrapper animate-fade-in">
        <table className="results-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h.replace(/_/g, " ").toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {headers.map((h) => {
                  const val = row[h];
                  return (
                    <td key={h}>
                      {typeof val === "object" && val !== null
                        ? JSON.stringify(val)
                        : val?.toString() || "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="nlquery-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <h1>Natural Language Query</h1>
          <p className="subtitle">Query ERP tables using plain English. The AI generates and runs safe SELECT queries on demand.</p>
        </div>
      </header>

      {/* Chat History Panel */}
      <div className="chat-window-wrapper">
        <div className="chat-history">
          {history.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon">
                <Sparkles size={32} />
              </div>
              <h3>WFX ERP AI Assistant</h3>
              <p>Type a question in the box below, or select a sample query from the options:</p>
              <div className="sample-grid">
                {sampleQueries.map((q, idx) => (
                  <button key={idx} className="sample-chip" onClick={() => handleSend(q)}>
                    {q}
                  </button>
                ))}
              </div>
              {error && <p className="inline-error">{error}</p>}
            </div>
          )}

          {history.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              {msg.role === "user" && (
                <div className="user-bubble">
                  <div className="bubble-label">You</div>
                  <div className="bubble-content">{msg.content}</div>
                </div>
              )}

              {msg.role === "assistant" && (
                <div className="assistant-bubble animate-slide-up">
                  <div className="bubble-label">WFX AI</div>
                  <div className="bubble-content">
                    <p className="ai-summary">{msg.summary}</p>
                    
                    {/* Collapsible/Sections for SQL and Results */}
                    <div className="ai-details-tabs">
                      {/* Generated SQL Section */}
                      <div className="sql-box">
                        <div className="sql-header">
                          <span>
                            <Code size={16} /> Generated SQL
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.sql, msg.id)}
                            className="btn-copy"
                            title="Copy SQL"
                          >
                            {copiedId === msg.id ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                        <pre className="sql-code">
                          <code>{msg.sql}</code>
                        </pre>
                      </div>

                      {/* SQL Result Table Section */}
                      <div className="results-box">
                        <div className="results-header">
                          <span>
                            <Table size={16} /> Query Results ({msg.rows?.length || 0} rows)
                          </span>
                        </div>
                        {renderTable(msg.rows)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {msg.role === "error" && (
                <div className="error-bubble">
                  <div className="bubble-label">Error</div>
                  <div className="bubble-content">{msg.content}</div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant loading">
              <div className="assistant-bubble animate-pulse">
                <div className="bubble-label">WFX AI</div>
                <div className="bubble-content loading-content">
                  <Loader className="spinner" size={18} />
                  <span>{loadingStep}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input
            type="text"
            placeholder="Ask anything, e.g. Which buyer generated the highest revenue?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button className="btn-send" onClick={() => handleSend()} disabled={loading || !question.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
