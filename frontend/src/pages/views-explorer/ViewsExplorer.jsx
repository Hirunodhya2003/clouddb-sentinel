
import { useEffect, useState } from "react";

import ViewList from "../../components/views-explorer/ViewList";
import ViewResultTable from "../../components/views-explorer/ViewResultTable";

import {
  getProductSummaries,
  getVariantDetails
} from "../../services/viewsExplorerService";

export default function ViewsExplorer() {
  const [selectedView, setSelectedView] = useState("products");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadViewData() {
      try {
        setLoading(true);
        setError("");
        setData([]);

        let result = [];

        if (selectedView === "products") {
          result = await getProductSummaries();
        } else if (selectedView === "variants") {
          result = await getVariantDetails();
        }

        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err.message || "Failed to load view data");
      } finally {
        setLoading(false);
      }
    }

    loadViewData();
  }, [selectedView]);

  function handleViewChange(viewId) {
    setSelectedView(viewId);
  }

  return (
    <div>
      <h1>Database Views Explorer</h1>

      <p>
        Explore product summaries and product variant details
        using database views.
      </p>

      <ViewList
        selectedView={selectedView}
        onViewChange={handleViewChange}
      />

      <ViewResultTable
        selectedView={selectedView}
        data={data}
        loading={loading}
        error={error}
      />
    </div>
  );
}
