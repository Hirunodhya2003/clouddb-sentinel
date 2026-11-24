import React, { useCallback, useEffect, useState } from "react";
import IndexForm from "../../components/index-manager/IndexForm";
import IndexTable from "../../components/index-manager/IndexTable";
import indexManagerService from "../../services/indexManagerService";

export default function IndexManager() {
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadIndexes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await indexManagerService.getIndexes();
      setIndexes(Array.isArray(result) ? result : result.indexes || []);
    } catch (err) {
      setError(err.message || "Unable to retrieve indexes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIndexes();
  }, [loadIndexes]);

  async function createIndex(data) {
    setCreating(true);
    setError("");
    setMessage("");

    try {
      await indexManagerService.createIndex(data);
      setMessage("Index created successfully.");
      await loadIndexes();
    } catch (err) {
      setError(err.message || "Unable to create index.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteIndex(tableName, indexName) {
    if (!window.confirm(`Drop index "${indexName}" from "${tableName}"?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await indexManagerService.deleteIndex(tableName, indexName);
      setMessage("Index deleted successfully.");
      await loadIndexes();
    } catch (err) {
      setError(err.message || "Unable to delete index.");
    }
  }

  return (
    <div style={{ padding: "24px", color: "#292524" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "22px",
      }}>
        <div>
          <h1>Database Index Manager</h1>
          <p style={{ color: "#78716c" }}>
            Inspect and manage database indexes.
          </p>
        </div>

        <button onClick={loadIndexes} disabled={loading}>
          Refresh Indexes
        </button>
      </div>

      {message && <p style={{ color: "#166534" }}>{message}</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div style={{ marginBottom: "25px" }}>
        <IndexForm onSubmit={createIndex} loading={creating} />
      </div>

      <section style={{
        background: "#fff",
        border: "1px solid #e7e5e4",
        borderRadius: "10px",
        padding: "18px",
      }}>
        <h2>Existing Indexes</h2>
        <IndexTable
          indexes={indexes}
          loading={loading}
          onDelete={deleteIndex}
        />
      </section>
    </div>
  );
}
