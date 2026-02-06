import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useProductStore } from "../stores/useProductStore";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";
import { useOrderStore } from "../stores/useOrderStore";
import { useInventoryStore } from "../stores/useInventoryStore";

const PosInvoiceTab = () => {
  const { products, fetchAllProducts } = useProductStore();
  const { methods, fetchMethods } = usePaymentMethodStore();
  const { publicMap } = useInventoryStore();
  const { createPosInvoice } = useOrderStore();
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchAllProducts();
    fetchMethods(true);
  }, [fetchAllProducts, fetchMethods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || [])
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);
  }, [products, query]);

  const addProduct = (product) => {
    const defaultPrice = Number(product.discountedPrice || product.price || 0);
    setLines((prev) => {
      const existing = prev.find((x) => x.productId === product._id);
      if (existing) {
        return prev.map((x) => (x.productId === product._id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          image: product.image,
          qty: 1,
          unitPrice: defaultPrice,
        },
      ];
    });
  };

  const updateLine = (productId, patch) =>
    setLines((prev) => prev.map((line) => (line.productId === productId ? { ...line, ...patch } : line)));
  const removeLine = (productId) => setLines((prev) => prev.filter((line) => line.productId !== productId));

  const total = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0), 0);

  const submit = async () => {
    if (!lines.length) return toast.error("Add at least one line");
    if (!paymentMethodId) return toast.error("Payment method is required");

    const invalidLine = lines.find((line) => !line.qty || line.qty <= 0 || line.unitPrice < 0);
    if (invalidLine) return toast.error("Please fix line quantity/unit price");

    try {
      const data = await createPosInvoice({
        paymentMethodId,
        items: lines.map((line) => ({
          productId: line.productId,
          qty: Number(line.qty),
          unitPrice: Number(line.unitPrice),
        })),
      });
      setResult(data);
      toast.success("POS invoice created");
      setLines([]);
      setQuery("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create invoice");
    }
  };

  return (
    <div className='space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white'>
      <h2 className='text-lg font-semibold'>POS / فاتورة يدوية</h2>

      <div>
        <label className='mb-1 block text-sm text-white/80'>Search product</label>
        <input
          className='w-full rounded bg-payzone-navy/60 p-2'
          placeholder='Type product name...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className='max-h-64 space-y-2 overflow-auto rounded border border-white/10 bg-black/20 p-2'>
        {filtered.map((p) => {
          const availableQty = publicMap?.[p._id]?.availableQuantity ?? 0;
          const disabled = availableQty <= 0;
          return (
            <button
              key={p._id}
              type='button'
              disabled={disabled}
              className='flex w-full items-center justify-between rounded border border-white/20 p-2 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
              onClick={() => addProduct(p)}
            >
              <div className='flex items-center gap-2'>
                <img src={p.image} alt={p.name} className='h-10 w-10 rounded object-cover' />
                <div>
                  <p className='font-medium'>{p.name}</p>
                  <p className='text-xs text-white/70'>Available: {availableQty}</p>
                </div>
              </div>
              <span className='text-sm text-white/70'>{Number(p.discountedPrice || p.price || 0).toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      <div className='space-y-2'>
        {lines.map((line) => (
          <div key={line.productId} className='grid grid-cols-12 items-center gap-2 rounded border border-white/10 p-2'>
            <div className='col-span-4 flex items-center gap-2'>
              {line.image ? <img src={line.image} alt={line.name} className='h-8 w-8 rounded object-cover' /> : null}
              <span>{line.name}</span>
            </div>
            <input
              className='col-span-2 rounded bg-payzone-navy/60 p-2'
              type='number'
              min='1'
              value={line.qty}
              onChange={(e) => updateLine(line.productId, { qty: Number(e.target.value) })}
            />
            <input
              className='col-span-3 rounded bg-payzone-navy/60 p-2'
              type='number'
              min='0'
              step='0.01'
              value={line.unitPrice}
              onChange={(e) => updateLine(line.productId, { unitPrice: Number(e.target.value) })}
            />
            <div className='col-span-2 text-right'>{(line.qty * line.unitPrice).toFixed(2)}</div>
            <button className='col-span-1 text-red-300' onClick={() => removeLine(line.productId)} type='button'>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className='mb-1 block text-sm text-white/80'>Payment Method</label>
        <select
          className='w-full rounded bg-payzone-navy/60 p-2'
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          required
        >
          <option value=''>Select payment method</option>
          {methods.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-center justify-between'>
        <p className='font-semibold'>Total: {total.toFixed(2)}</p>
        <button className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy' onClick={submit} type='button'>
          Create invoice
        </button>
      </div>

      {result ? <div className='rounded border border-payzone-gold/40 p-3'>Order {result.orderNumber} • Tracking {result.trackingCode}</div> : null}
    </div>
  );
};

export default PosInvoiceTab;
