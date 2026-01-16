import { useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchRecommendations } from "./api";
import "./App.css";

function Card({ title, children, right }) {
  return (
    <div className="card">
      <div className="cardHeader">
        <h2>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function ProductItem({ p }) {
  return (
    <div className="product">
      <div className="productTop">
        <div className="productName">{p.name}</div>
        <div className="productPrice">${p.price}</div>
      </div>
      <div className="productMeta">
        {p.category} • {(p.tags || []).join(", ")}
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [preference, setPreference] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReco, setLoadingReco] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [reasoning, setReasoning] = useState("");
  const [error, setError] = useState("");

  const canRecommend = useMemo(
    () => preference.trim().length > 0 && !loadingReco,
    [preference, loadingReco]
  );

  async function loadProducts() {
    setLoadingProducts(true);
    setError("");
    try {
      const data = await fetchProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load products (backend not reachable).");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function onRecommend() {
    if (!preference.trim()) return;

    setLoadingReco(true);
    setError("");
    setRecommended([]);
    setReasoning("");

    try {
      const data = await fetchRecommendations(preference);
      setRecommended(Array.isArray(data?.recommended) ? data.recommended : []);
      setReasoning(typeof data?.reasoning === "string" ? data.reasoning : "");
    } catch (e) {
      setError(e?.message || "Failed to get recommendations");
    } finally {
      setLoadingReco(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") onRecommend();
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <h1>AI Product Recommendation</h1>
          <p className="subtitle">
            Describe your needs (budget, category, features). The AI will recommend only from the products shown below.
          </p>
        </div>

        <div className="topActions">
          <button className="ghost" onClick={loadProducts} disabled={loadingProducts}>
            {loadingProducts ? "Refreshing…" : "Refresh products"}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="inputRow">
          <div className="inputWrap">
            <input
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder='e.g., "phone under $500", "noise canceling under $100"'
              aria-label="Preference input"
            />
            <div className="helperText">
              Tip: press <span className="kbd">Enter</span> to recommend
            </div>
          </div>

          <button className="primary" onClick={onRecommend} disabled={!canRecommend}>
            {loadingReco ? "Recommending…" : "Recommend"}
          </button>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="grid">
          <Card
            title="All Products"
            right={<span className="chip">{loadingProducts ? "Loading…" : `${products.length} items`}</span>}
          >
            {loadingProducts ? (
              <div className="muted">Loading product list…</div>
            ) : products.length === 0 ? (
              <div className="muted">No products found.</div>
            ) : (
              <div className="list">
                {products.map((p) => (
                  <ProductItem key={p.id} p={p} />
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Recommended"
            right={<span className="chip">{loadingReco ? "Thinking…" : `${recommended.length} picked`}</span>}
          >
            {recommended.length === 0 && !loadingReco ? (
              <div className="muted">No recommendations yet. Try: “phone under $500”.</div>
            ) : (
              <div className="list">
                {recommended.map((p) => (
                  <ProductItem key={p.id} p={p} />
                ))}
              </div>
            )}

            {reasoning && (
              <div className="reasonBox">
                <div className="reasonTitle">Why these?</div>
                <div className="reasonText">{reasoning}</div>
              </div>
            )}
          </Card>

 
          <Card title="Tips" right={<span className="chip">Shortcuts</span>}>
            <div className="tips">
              <div className="tipsSection">
                <div className="tipsTitle">Try queries like</div>
                <ul className="tipsList">
                  <li>laptop under $600 for office</li>
                  <li>noise canceling under $100</li>
                  <li>android phone with best camera</li>
                </ul>
              </div>

              <div className="tipsSection">
                <div className="tipsTitle">Pro tip</div>
                <div className="tipsText">
                  Press <span className="kbd">Enter</span> to recommend.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
