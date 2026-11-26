

export default function ViewList({ selectedView, onViewChange }) {

  const views = [
    {
      id: "products",
      name: "Product Summary View",
      description: "View product information and variant counts."
    },
    {
      id: "variants",
      name: "Variant Details View",
      description: "View complete product variant information."
    }
  ];

  return (
    <div>
      <h2>Available Database Views</h2>

      <p>Select a database view to explore.</p>

      <div>
        {views.map((view) => (
          <div key={view.id}>
            <h3>{view.name}</h3>

            <p>{view.description}</p>

            <button
              type="button"
              onClick={() => onViewChange(view.id)}
              disabled={selectedView === view.id}
            >
              {selectedView === view.id
                ? "Selected"
                : "View Data"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
