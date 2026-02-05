import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useProductStore } from "../stores/useProductStore";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";
import { useOrderStore } from "../stores/useOrderStore";

const PosInvoiceTab = () => {
  const { products, fetchAllProducts } = useProductStore();
  const { methods, fetchMethods } = usePaymentMethodStore();
  const { createPosInvoice } = useOrderStore();
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchAllProducts();
    fetchMethods(true);
  }, [fetchAllProducts, fetchMethods]);

  useEffect(() => {
    if (!paymentMethodId && methods?.[0]?._id) setPaymentMethodId(methods[0]._id);
  }, [methods, paymentMethodId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || []).filter((p) => !q || p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [products, query]);

  const addProduct = (product) => {
    setLines((prev) => {
      const existing = prev.find((x) => x.productId === product._id);
      if (existing) {
        return prev.map((x) => x.productId === product._id ? { ...x, quantity: x.quantity + 1 } : x);
      }
      return [...prev, { productId: product._id, name: product.name, quantity: 1, price: Number(product.discountedPrice || product.price || 0) }];
    });
  };

  const updateLine = (productId, patch) => setLines((prev) => prev.map((line) => line.productId === productId ? { ...line, ...patch } : line));
  const removeLine = (productId) => setLines((prev) => prev.filter((line) => line.productId !== productId));

  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0);

  const submit = async () => {
    if (!lines.length) return toast.error("Add at least one line");
    try {
      const data = await createPosInvoice({ lines, paymentMethodId });
      setResult(data);
      toast.success("POS invoice created");
      setLines([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create invoice");
    }
  };

  return (
    <div className='space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white'>
      <h2 className='text-lg font-semibold'>POS / فاتورة يدوية</h2>
      <input className='w-full rounded bg-payzone-navy/60 p-2' placeholder='Search product' value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className='grid gap-2'>
        {filtered.map((p) => (
          <button key={p._id} className='rounded border border-white/20 p-2 text-left hover:bg-white/10' onClick={() => addProduct(p)}>{p.name}</button>
        ))}
      </div>

      <div className='space-y-2'>
        {lines.map((line) => (
          <div key={line.productId} className='grid grid-cols-12 items-center gap-2 rounded border border-white/10 p-2'>
            <div className='col-span-4'>{line.name}</div>
            <input className='col-span-2 rounded bg-payzone-navy/60 p-2' type='number' min='1' value={line.quantity} onChange={(e) => updateLine(line.productId, { quantity: Number(e.target.value) })} />
            <input className='col-span-3 rounded bg-payzone-navy/60 p-2' type='number' min='0' step='0.01' value={line.price} onChange={(e) => updateLine(line.productId, { price: Number(e.target.value) })} />
            <div className='col-span-2 text-right'>{(line.quantity * line.price).toFixed(2)}</div>
            <button className='col-span-1 text-red-300' onClick={() => removeLine(line.productId)}>✕</button>
          </div>
        ))}
      </div>

      <select className='w-full rounded bg-payzone-navy/60 p-2' value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
        {methods.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
      </select>

      <div className='flex items-center justify-between'>
        <p className='font-semibold'>Total: {total.toFixed(2)}</p>
        <button className='rounded bg-payzone-gold px-4 py-2 text-payzone-navy font-semibold' onClick={submit}>Create invoice</button>
      </div>

      {result ? <div className='rounded border border-payzone-gold/40 p-3'>Order {result.orderNumber} • Tracking {result.trackingCode}</div> : null}
    </div>
  );
};

export default PosInvoiceTab;
