import { useMemo, useState } from 'react';

const starterSuppliers = [
  { id: 'SUP-0042', name: 'Lanka Textile Mills', contact: 'Nimali Perera', email: 'nimali@lankatextile.lk', phone: '+94 11 234 8900', city: 'Colombo', status: 'Active' },
  { id: 'SUP-0041', name: 'Ceylon Cotton House', contact: 'Ruwan Silva', email: 'orders@ceyloncotton.lk', phone: '+94 77 245 3210', city: 'Gampaha', status: 'Active' },
  { id: 'SUP-0040', name: 'Island Threads Co.', contact: 'Anushka Fernando', email: 'sales@islandthreads.lk', phone: '+94 31 222 7014', city: 'Negombo', status: 'Active' },
  { id: 'SUP-0039', name: 'Blue Loom Apparel', contact: 'Kasun Jayawardena', email: 'hello@blueloom.lk', phone: '+94 81 440 1902', city: 'Kandy', status: 'Inactive' },
];

const starterPurchases = [
  { id: 'PUR-2024', supplier: 'Lanka Textile Mills', date: '24 Nov 2026', items: 8, total: 485000, status: 'Received' },
  { id: 'PUR-2023', supplier: 'Ceylon Cotton House', date: '22 Nov 2026', items: 5, total: 276500, status: 'Received' },
  { id: 'PUR-2022', supplier: 'Island Threads Co.', date: '19 Nov 2026', items: 12, total: 612000, status: 'Pending' },
  { id: 'PUR-2021', supplier: 'Lanka Textile Mills', date: '16 Nov 2026', items: 4, total: 184000, status: 'Received' },
  { id: 'PUR-2020', supplier: 'Ceylon Cotton House', date: '14 Nov 2026', items: 7, total: 352000, status: 'Cancelled' },
];

const money = (amount) => `LKR ${Number(amount || 0).toLocaleString('en-LK')}`;
const today = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20"/></>,
    cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.9-1.5L21 9H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v4h14v-4"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.grid}</svg>;
}

function Button({ children, variant = 'primary', icon, onClick, type = 'button' }) {
  return <button type={type} className={`m04-button m04-button-${variant}`} onClick={onClick}>{icon && <Icon name={icon} size={16}/>}<span>{children}</span></button>;
}

function Status({ children }) {
  const key = String(children).toLowerCase();
  return <span className={`m04-status m04-status-${key}`}>{children}</span>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="m04-page-heading"><div><div className="m04-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function MetricCard({ label, value, note, icon, tone = 'blue' }) {
  return <article className="m04-metric"><div className={`m04-metric-icon ${tone}`}><Icon name={icon}/></div><div className="m04-metric-label">{label}</div><strong>{value}</strong><div className="m04-metric-note"><span><Icon name="trend" size={14}/>{note}</span> vs last month</div></article>;
}

function PurchaseTable({ purchases, onOpen }) {
  return <div className="m04-table-wrap"><table className="m04-table"><thead><tr><th>Purchase ID</th><th>Supplier</th><th>Purchase date</th><th>Items</th><th>Total amount</th><th>Status</th><th></th></tr></thead><tbody>
    {purchases.map((purchase) => <tr key={purchase.id}><td><button className="m04-link" onClick={() => onOpen(purchase)}>{purchase.id}</button></td><td><div className="m04-name-cell"><span className="m04-avatar supplier-avatar">{purchase.supplier.slice(0, 1)}</span>{purchase.supplier}</div></td><td>{purchase.date}</td><td>{purchase.items} items</td><td className="m04-amount">{money(purchase.total)}</td><td><Status>{purchase.status}</Status></td><td><button className="m04-icon-button" aria-label={`Open ${purchase.id}`} onClick={() => onOpen(purchase)}><Icon name="chevron"/></button></td></tr>)}
    {!purchases.length && <tr><td className="m04-empty" colSpan="7">No purchases match your search.</td></tr>}
  </tbody></table></div>;
}

function SupplierTable({ suppliers, onEdit, onDelete }) {
  return <div className="m04-table-wrap"><table className="m04-table"><thead><tr><th>Supplier</th><th>Contact person</th><th>Email address</th><th>Phone</th><th>Location</th><th>Status</th><th></th></tr></thead><tbody>
    {suppliers.map((supplier) => <tr key={supplier.id}><td><div className="m04-name-cell"><span className="m04-avatar supplier-avatar">{supplier.name.slice(0, 1)}</span><div><strong>{supplier.name}</strong><small>{supplier.id}</small></div></div></td><td>{supplier.contact}</td><td>{supplier.email}</td><td>{supplier.phone}</td><td>{supplier.city}</td><td><Status>{supplier.status}</Status></td><td><div className="m04-row-actions"><button className="m04-icon-button" aria-label={`Edit ${supplier.name}`} title="Edit supplier" onClick={() => onEdit(supplier)}><Icon name="chevron"/></button><button className="m04-icon-button m04-delete-button" aria-label={`Delete ${supplier.name}`} title="Delete supplier" onClick={() => onDelete(supplier)}><Icon name="close"/></button></div></td></tr>)}
    {!suppliers.length && <tr><td className="m04-empty" colSpan="7">No suppliers match your search.</td></tr>}
  </tbody></table></div>;
}

function SupplierForm({ supplier, onSave, onCancel }) {
  const [form, setForm] = useState(supplier || { name: '', contact: '', email: '', phone: '', city: '', status: 'Active' });
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return <><PageHeading eyebrow="Supplier management / Supplier directory" title={supplier ? 'Edit supplier' : 'Add supplier'} description="Keep supplier contact details accurate for your purchasing team." />
    <form className="m04-form-card" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="m04-card-title"><div><h2>Supplier information</h2><p>Fields marked with * are required.</p></div><span className="m04-form-badge">Basic details</span></div>
      <div className="m04-form-grid"><label>Supplier name *<input required name="name" value={form.name} onChange={change} placeholder="e.g. Lanka Textile Mills"/></label><label>Contact person *<input required name="contact" value={form.contact} onChange={change} placeholder="Full name"/></label><label>Email address *<input required type="email" name="email" value={form.email} onChange={change} placeholder="name@company.com"/></label><label>Phone number<input name="phone" value={form.phone} onChange={change} placeholder="+94 11 234 5678"/></label><label>City<input name="city" value={form.city} onChange={change} placeholder="City"/></label><label>Status<select name="status" value={form.status} onChange={change}><option>Active</option><option>Inactive</option></select></label><label className="m04-full">Notes<textarea rows="4" placeholder="Add a note about this supplier (optional)"/></label></div>
      <div className="m04-form-footer"><span>Supplier records are available to authorized purchasing staff.</span><div><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" icon="check">{supplier ? 'Save changes' : 'Save supplier'}</Button></div></div>
    </form></>;
}

function PurchaseCreate({ suppliers, onCancel, onSave }) {
  const [supplier, setSupplier] = useState(suppliers.find((item) => item.status === 'Active')?.name || '');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([{ id: 1, product: 'Classic Cotton Tee · White / M', quantity: 120, cost: 1250 }]);
  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.cost) || 0), 0);
  const updateLine = (id, key, value) => setLines(lines.map((line) => line.id === id ? { ...line, [key]: value } : line));
  return <><PageHeading eyebrow="Purchases / New purchase" title="Create purchase" description="Record stock received from a supplier. Inventory updates after the purchase is saved." />
    <form className="m04-form-card m04-purchase-form" onSubmit={(event) => { event.preventDefault(); onSave({ supplier, reference, lines, total }); }}>
      <div className="m04-card-title"><div><h2>Purchase details</h2><p>Enter the supplier and items included in this order.</p></div><span className="m04-form-badge"><Icon name="shield" size={14}/> ACID transaction</span></div>
      <div className="m04-form-grid"><label>Supplier *<select required value={supplier} onChange={(event) => setSupplier(event.target.value)}>{suppliers.filter((item) => item.status === 'Active').map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Supplier invoice / reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional reference number"/></label><label>Purchase date<input type="date" defaultValue="2026-11-24"/></label><label>Expected / received status<select defaultValue="Received"><option>Received</option><option>Pending</option></select></label></div>
      <div className="m04-line-items"><div className="m04-line-heading"><div><h3>Purchase items</h3><p>Add each product variant and quantity.</p></div><button className="m04-text-button" type="button" onClick={() => setLines([...lines, { id: Date.now(), product: '', quantity: 1, cost: 0 }])}><Icon name="plus" size={15}/> Add item</button></div>
        {lines.map((line, index) => <div className="m04-item-line" key={line.id}><div className="m04-item-number">{String(index + 1).padStart(2, '0')}</div><label className="m04-product-field">Product / variant<select required value={line.product} onChange={(event) => updateLine(line.id, 'product', event.target.value)}><option value="">Select a product variant</option><option>Classic Cotton Tee · White / M</option><option>Classic Cotton Tee · Black / L</option><option>Oxford Shirt · Blue / M</option><option>Linen Trousers · Sand / 32</option></select></label><label>Quantity<input required min="1" type="number" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)}/></label><label>Unit cost (LKR)<input required min="0" type="number" value={line.cost} onChange={(event) => updateLine(line.id, 'cost', event.target.value)}/></label><div className="m04-line-total"><small>Line total</small><strong>{money((Number(line.quantity) || 0) * (Number(line.cost) || 0))}</strong></div>{lines.length > 1 && <button className="m04-remove-line" type="button" aria-label="Remove item" onClick={() => setLines(lines.filter((item) => item.id !== line.id))}><Icon name="close" size={16}/></button>}</div>)}
      </div>
      <div className="m04-purchase-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Other charges</span><strong>{money(0)}</strong></div><div className="grand-total"><span>Total purchase</span><strong>{money(total)}</strong></div></div>
      <div className="m04-info-note"><Icon name="shield" size={18}/><span><strong>Protected by a database transaction</strong><br/>The purchase, line items, and stock update will be saved together or rolled back together.</span></div>
      <div className="m04-form-footer"><span>Purchase date: {today}</span><div><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" icon="check">Save purchase</Button></div></div>
    </form></>;
}

function PurchaseDetail({ purchase, onBack }) {
  return <><PageHeading eyebrow="Purchases / Purchase details" title={purchase.id} description="Review the purchase record, supplier, and items received." action={<Button variant="secondary" icon="arrow" onClick={onBack}>Back to purchases</Button>} />
    <div className="m04-detail-grid"><section className="m04-panel"><div className="m04-card-title"><div><h2>Purchase overview</h2><p>Purchase record and supplier information</p></div><Status>{purchase.status}</Status></div><div className="m04-detail-fields"><div><small>Purchase ID</small><strong>{purchase.id}</strong></div><div><small>Purchase date</small><strong>{purchase.date}</strong></div><div><small>Supplier</small><strong>{purchase.supplier}</strong></div><div><small>Items</small><strong>{purchase.items} items</strong></div><div><small>Reference</small><strong>INV-{purchase.id.slice(-4)}</strong></div><div><small>Created by</small><strong>Store Manager</strong></div></div></section><section className="m04-panel"><div className="m04-card-title"><div><h2>Transaction record</h2><p>Database operation status</p></div><span className="m04-success-icon"><Icon name="check"/></span></div><div className="m04-transaction-success"><strong>Purchase saved successfully</strong><p>Purchase and purchase items were committed together. Inventory update is recorded in the same transaction.</p><span><Icon name="shield" size={14}/> ACID transaction · COMMIT</span></div><div className="m04-total-block"><span>Total purchase value</span><strong>{money(purchase.total)}</strong></div></section></div>
    <section className="m04-panel m04-detail-items"><div className="m04-card-title"><div><h2>Items in this purchase</h2><p>Product variants and quantities received</p></div></div><div className="m04-table-wrap"><table className="m04-table"><thead><tr><th>Product / variant</th><th>Quantity</th><th>Unit cost</th><th>Line total</th></tr></thead><tbody><tr><td>Classic Cotton Tee · White / M</td><td>{purchase.items} units</td><td>{money(Math.round(purchase.total / Math.max(purchase.items, 1)))}</td><td className="m04-amount">{money(purchase.total)}</td></tr></tbody></table></div></section></>;
}

function TransactionDemo({ result, onRun }) {
  return <><PageHeading eyebrow="Advanced database / Transactions" title="Transaction demo" description="See how ACID transactions protect purchase data and inventory." />
    <div className="m04-demo-banner"><div className="m04-demo-shield"><Icon name="shield" size={23}/></div><div><strong>Purchase operations are all-or-nothing</strong><p>A purchase order, its line items, and its inventory change belong to one database transaction.</p></div><Status>ACID enabled</Status></div>
    <div className="m04-demo-layout"><section className="m04-panel"><div className="m04-card-title"><div><h2>Choose a scenario</h2><p>Run a sample transaction to view the outcome.</p></div></div><div className="m04-scenario-list"><button className="m04-scenario" onClick={() => onRun('commit')}><span className="m04-scenario-icon mint"><Icon name="check"/></span><span><strong>Successful purchase</strong><small>Save purchase and items, then commit</small></span><Icon name="chevron"/></button><button className="m04-scenario" onClick={() => onRun('rollback')}><span className="m04-scenario-icon coral"><Icon name="close"/></span><span><strong>Force a failure</strong><small>Reject an item and roll back all changes</small></span><Icon name="chevron"/></button><button className="m04-scenario" onClick={() => onRun('isolation')}><span className="m04-scenario-icon blue"><Icon name="grid"/></span><span><strong>Read consistency</strong><small>Show what another session can see</small></span><Icon name="chevron"/></button></div><div className="m04-transaction-steps"><h3>Transaction flow</h3><div className="m04-steps"><span className="done">1<strong>BEGIN</strong></span><i/><span className="done">2<strong>VALIDATE</strong></span><i/><span className={result ? 'done' : ''}>3<strong>WRITE</strong></span><i/><span className={result?.kind === 'commit' ? 'done' : ''}>4<strong>COMMIT</strong></span></div><p>Any error before COMMIT triggers ROLLBACK.</p></div></section>
      <section className="m04-panel m04-result-panel"><div className="m04-card-title"><div><h2>Scenario result</h2><p>Execution details</p></div><span className="m04-live-dot">Preview</span></div>{result ? <div className={`m04-result-content ${result.kind}`}><div className="m04-result-icon"><Icon name={result.kind === 'rollback' ? 'close' : 'check'} size={22}/></div><div><strong>{result.title}</strong><p>{result.description}</p></div><div className="m04-code-box"><div><span>TRANSACTION</span><Status>{result.kind === 'rollback' ? 'Rolled back' : 'Committed'}</Status></div><code>{result.sql}</code><code>{result.outcome}</code></div></div> : <div className="m04-result-empty"><div className="m04-result-empty-icon"><Icon name="receipt" size={26}/></div><strong>No scenario run yet</strong><p>Choose a scenario to see its transaction result here.</p></div>}</section></div>
    <section className="m04-panel m04-acid-grid"><div className="m04-card-title"><div><h2>ACID properties</h2><p>How this purchase flow protects your records</p></div></div><div className="m04-acid-cards"><div><b>A</b><strong>Atomicity</strong><p>All purchase records save together or none are saved.</p></div><div><b>C</b><strong>Consistency</strong><p>Database rules keep purchase and stock data valid.</p></div><div><b>I</b><strong>Isolation</strong><p>Concurrent operations do not expose partial changes.</p></div><div><b>D</b><strong>Durability</strong><p>Committed purchases remain recorded.</p></div></div></section>
  </>;
}

export default function Member04Workspace() {
  const [suppliers, setSuppliers] = useState(starterSuppliers);
  const [purchases, setPurchases] = useState(starterPurchases);
  const [screen, setScreen] = useState('purchases');
  const [query, setQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All suppliers');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [scenario, setScenario] = useState(null);
  const supplierCount = suppliers.filter((item) => item.status === 'Active').length;
  const filteredPurchases = useMemo(() => purchases.filter((item) => `${item.id} ${item.supplier} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [purchases, query]);
  const filteredSuppliers = useMemo(() => suppliers.filter((item) => {
    const matchesQuery = `${item.name} ${item.contact} ${item.city} ${item.email} ${item.id}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = supplierFilter === 'All suppliers' || item.status === supplierFilter;
    return matchesQuery && matchesStatus;
  }), [suppliers, query, supplierFilter]);
  const navigate = (next) => { setScreen(next); setQuery(''); setSupplierFilter('All suppliers'); setEditing(null); setSelected(null); };
  const deleteSupplier = (supplier) => {
    const hasPurchases = purchases.some((purchase) => purchase.supplier === supplier.name);
    if (hasPurchases) {
      window.alert('This supplier has purchase records and cannot be deleted in this preview. Set the supplier to Inactive instead.');
      return;
    }
    if (window.confirm(`Delete ${supplier.name}? This action cannot be undone.`)) {
      setSuppliers((current) => current.filter((item) => item.id !== supplier.id));
    }
  };
  const saveSupplier = (form) => {
    if (editing) setSuppliers(suppliers.map((item) => item.id === editing.id ? { ...form, id: item.id } : item));
    else setSuppliers([{ ...form, id: `SUP-${String(43 + suppliers.length - starterSuppliers.length).padStart(4, '0')}` }, ...suppliers]);
    navigate('suppliers');
  };
  const savePurchase = (form) => {
    const purchase = { id: `PUR-${2025 + purchases.length - starterPurchases.length}`, supplier: form.supplier, date: today, items: form.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0), total: form.total, status: 'Received' };
    setPurchases([purchase, ...purchases]); setSelected(purchase); navigate('purchase-detail');
  };
  const runScenario = (kind) => {
    const values = {
      commit: { kind, title: 'Purchase committed', description: 'Purchase and item records were saved. Inventory was updated and the transaction completed.', sql: 'BEGIN → INSERT purchase → INSERT items → UPDATE inventory', outcome: 'COMMIT — all changes are visible' },
      rollback: { kind, title: 'Purchase rolled back', description: 'A simulated item validation failed. The purchase, its items, and inventory changes were rolled back together.', sql: 'BEGIN → INSERT purchase → validation error → ROLLBACK', outcome: 'ROLLBACK — no partial changes remain' },
      isolation: { kind, title: 'Uncommitted data is isolated', description: 'A second session cannot read the purchase until the first session commits it.', sql: 'SESSION A: BEGIN + INSERT  ·  SESSION B: SELECT', outcome: 'SESSION B sees committed records only' },
    };
    setScenario(values[kind]);
  };
  const titleMap = { purchases: ['Purchases', 'Manage supplier orders and goods received.'], suppliers: ['Suppliers', 'Manage the businesses you purchase stock from.'] };
  const isList = screen === 'purchases' || screen === 'suppliers';
  const [title, description] = titleMap[screen] || titleMap.purchases;

  return <div className="m04-app-shell">
    <aside className="m04-sidebar"><div className="m04-brand"><div className="m04-brand-mark"><span>SP</span></div><div><strong>SP APPARELS</strong><small>CLOUDDB SENTINEL</small></div><button aria-label="Collapse menu" className="m04-collapse"><span>‹</span></button></div>
      <div className="m04-side-caption">WORKSPACE</div><button className="m04-nav-item"><Icon name="grid"/><span>Dashboard</span></button><button className="m04-nav-item"><Icon name="box"/><span>Products</span><Icon name="chevron" size={14}/></button><button className="m04-nav-item"><Icon name="box"/><span>Inventory</span><Icon name="chevron" size={14}/></button>
      <div className="m04-side-caption spaced">BUSINESS</div><button className="m04-nav-item" onClick={() => navigate('suppliers')}><Icon name="people"/><span>Suppliers</span></button><button className={`m04-nav-item ${['purchases','new-purchase','purchase-detail'].includes(screen) ? 'active' : ''}`} onClick={() => navigate('purchases')}><Icon name="cart"/><span>Purchases</span><Icon name="chevron" size={14}/></button><button className="m04-nav-item"><Icon name="receipt"/><span>Sales</span><Icon name="chevron" size={14}/></button>
      <div className="m04-side-caption spaced">DATABASE TOOLS</div><button className="m04-nav-item" onClick={() => navigate('transaction-demo')}><Icon name="shield"/><span>Transaction demo</span></button>
      <div className="m04-sidebar-bottom"><button className="m04-nav-item"><span className="m04-help-mark">?</span><span>Help & support</span></button><div className="m04-user-card"><span className="m04-user-avatar">SM</span><span><strong>Store Manager</strong><small>Administrator</small></span><Icon name="more" size={17}/></div></div>
    </aside>
    <main className="m04-main"><header className="m04-topbar"><div className="m04-breadcrumb"><span>SP Apparels</span><Icon name="chevron" size={14}/><strong>{screen.includes('supplier') ? 'Suppliers' : screen.includes('transaction') ? 'Database tools' : 'Purchases'}</strong></div><div className="m04-top-actions"><label className="m04-global-search"><Icon name="search" size={17}/><input aria-label="Search" placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="m04-top-icon" aria-label="Notifications">♧<i/></button><span className="m04-top-avatar">SM</span></div></header>
      <div className="m04-content"><div className="m04-preview-notice"><span><i/> Preview mode</span><span>Sample data · Not connected to the database yet</span></div>
        {isList && <><PageHeading eyebrow={`Business management / ${title}`} title={title} description={description} action={<div className="m04-heading-actions"><Button variant="secondary" icon="download" onClick={() => window.print()}>Export</Button><Button icon="plus" onClick={() => navigate(screen === 'suppliers' ? 'new-supplier' : 'new-purchase')}>{screen === 'suppliers' ? 'Add supplier' : 'New purchase'}</Button></div>} />
          <div className="m04-metrics">{screen === 'purchases' ? <><MetricCard label="Total purchases" value={purchases.length.toLocaleString()} note="12.8%" icon="cart"/><MetricCard label="Purchase value" value={money(purchases.reduce((sum, item) => sum + item.total, 0))} note="8.2%" icon="trend" tone="purple"/><MetricCard label="Active suppliers" value={supplierCount} note="2 new" icon="people" tone="green"/><MetricCard label="Awaiting delivery" value={purchases.filter((item) => item.status === 'Pending').length} note="Needs attention" icon="calendar" tone="amber"/></> : <><MetricCard label="All suppliers" value={suppliers.length} note="8.4%" icon="people"/><MetricCard label="Active suppliers" value={supplierCount} note="2 new" icon="check" tone="green"/><MetricCard label="Purchases this month" value={purchases.length} note="12.8%" icon="cart" tone="purple"/><MetricCard label="Supplier locations" value={new Set(suppliers.map((item) => item.city)).size} note="Across Sri Lanka" icon="grid" tone="amber"/></>}</div>
          <section className="m04-panel m04-list-panel"><div className="m04-panel-toolbar"><div><h2>{screen === 'suppliers' ? 'Supplier directory' : 'Purchase history'}</h2><p>{screen === 'suppliers' ? 'A complete list of your registered suppliers.' : 'Track and manage every purchase order.'}</p></div><div className="m04-list-controls"><label className="m04-table-search"><Icon name="search" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={screen === 'suppliers' ? 'Search suppliers...' : 'Search purchase ID or supplier...'}/></label><button className="m04-filter-button"><span>All statuses</span><span>⌄</span></button><button className="m04-filter-button"><Icon name="calendar" size={15}/><span>All dates</span><span>⌄</span></button></div></div>
            <div className="m04-tab-row">{(screen === 'suppliers' ? ['All suppliers', 'Active', 'Inactive'] : ['All purchases', 'Received', 'Pending', 'Cancelled']).map((tab, index) => <button key={tab} onClick={() => screen === 'suppliers' && setSupplierFilter(tab)} className={(screen === 'suppliers' ? supplierFilter === tab : index === 0) ? 'selected' : ''}>{tab}<span>{screen === 'suppliers' ? (tab === 'All suppliers' ? suppliers.length : suppliers.filter((item) => item.status === tab).length) : (index === 0 ? purchases.length : purchases.filter((item) => item.status === tab).length)}</span></button>)}</div>
            {screen === 'suppliers' ? <SupplierTable suppliers={filteredSuppliers} onEdit={(supplier) => { setEditing(supplier); setScreen('edit-supplier'); }} onDelete={deleteSupplier}/>: <PurchaseTable purchases={filteredPurchases} onOpen={(purchase) => { setSelected(purchase); setScreen('purchase-detail'); }}/ >}
            <div className="m04-table-footer"><span>Showing <strong>{screen === 'suppliers' ? filteredSuppliers.length : filteredPurchases.length}</strong> of <strong>{screen === 'suppliers' ? suppliers.length : purchases.length}</strong> records</span><div><button disabled>‹</button><button className="current">1</button><button>2</button><button>3</button><button>›</button></div></div>
          </section></>}
        {screen === 'new-supplier' && <SupplierForm onSave={saveSupplier} onCancel={() => navigate('suppliers')}/>}
        {screen === 'edit-supplier' && <SupplierForm supplier={editing} onSave={saveSupplier} onCancel={() => navigate('suppliers')}/>}
        {screen === 'new-purchase' && <PurchaseCreate suppliers={suppliers} onCancel={() => navigate('purchases')} onSave={savePurchase}/>}
        {screen === 'purchase-detail' && selected && <PurchaseDetail purchase={selected} onBack={() => navigate('purchases')}/>}
        {screen === 'transaction-demo' && <TransactionDemo result={scenario} onRun={runScenario}/>}
        <footer className="m04-footer"><span>CloudDB Sentinel <b>·</b> Apparel inventory & business management</span><span>Member 04 preview <b>·</b> v1.0</span></footer>
      </div>
    </main>
  </div>;
}
