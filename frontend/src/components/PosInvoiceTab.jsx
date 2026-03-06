import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useProductStore } from "../stores/useProductStore";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";
import { useOrderStore } from "../stores/useOrderStore";
import { useInventoryStore } from "../stores/useInventoryStore";

const PosInvoiceTab = () => {
  const { products, fetchAllProducts } = useProductStore();
  const { methods, fetchMethods } = usePaymentMethodStore();
  const { publicMap, fetchPublicSummary } = useInventoryStore();
  const { createPosInvoice } = useOrderStore();
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchAllProducts();
    fetchMethods();
  }, [fetchAllProducts, fetchMethods]);

  useEffect(() => {
    const ids = (products || []).map((product) => product?._id).filter(Boolean);
    if (!ids.length) return;
    fetchPublicSummary(ids);
  }, [products, fetchPublicSummary]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || [])
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);
  }, [products, query]);

  const addProduct = (product, type = "full", selectedPortion = null) => {
    const isPortion = type === "portion";
    const portionSizeMl = isPortion ? Number(selectedPortion?.size_ml || 0) : null;
    const defaultPrice = isPortion
      ? Number(selectedPortion?.price || 0)
      : Number(product.discountedPrice || product.price || 0);
    const lineKey = isPortion ? `${product._id}-portion-${portionSizeMl}` : `${product._id}-full`;

    setLines((prev) => {
      const existing = prev.find((x) => x.lineKey === lineKey);
      if (existing) {
        return prev.map((x) => (x.lineKey === lineKey ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...prev,
        {
          lineKey,
          productId: product._id,
          name: product.name,
          image: product.image,
          type,
          portionSizeMl,
          qty: 1,
          unitPrice: defaultPrice,
        },
      ];
    });
  };

  const updateLine = (lineKey, patch) =>
    setLines((prev) => prev.map((line) => (line.lineKey === lineKey ? { ...line, ...patch } : line)));
  const removeLine = (lineKey) => setLines((prev) => prev.filter((line) => line.lineKey !== lineKey));

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
          type: line.type || "full",
          portionSizeMl: line.type === "portion" ? Number(line.portionSizeMl) : null,
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
          const hasPortions = Boolean(p.hasPortions) && Array.isArray(p.portions) && p.portions.length > 0;
          return (
            <div key={p._id} className='rounded border border-white/20 p-2'>
              <div className='flex items-center gap-2'>
                <img src={p.image} alt={p.name} className='h-10 w-10 rounded object-cover' />
                <div>
                  <p className='font-medium'>{p.name}</p>
                  <p className='text-xs text-white/70'>Available: {availableQty}</p>
                </div>
              </div>
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                <button
                  type='button'
                  disabled={availableQty <= 0}
                  className='rounded bg-white/10 px-2 py-1 text-xs transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50'
                  onClick={() => addProduct(p, "full")}
                >
                  Full bottle • {Number(p.discountedPrice || p.price || 0).toFixed(2)}
                </button>

                {hasPortions &&
                  p.portions.map((portion) => (
                    <button
                      key={`${p._id}-${portion.size_ml}`}
                      type='button'
                      className='rounded bg-payzone-gold/20 px-2 py-1 text-xs text-payzone-gold transition hover:bg-payzone-gold/30'
                      onClick={() => addProduct(p, "portion", portion)}
                    >
                      {Number(portion.size_ml)}ml • {Number(portion.price || 0).toFixed(2)}
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className='space-y-2'>
        {lines.map((line) => (
          <div key={line.lineKey} className='grid grid-cols-12 items-center gap-2 rounded border border-white/10 p-2'>
            <div className='col-span-4 flex items-center gap-2'>
              {line.image ? <img src={line.image} alt={line.name} className='h-8 w-8 rounded object-cover' /> : null}
              <div>
                <span>{line.name}</span>
                {line.type === "portion" ? <p className='text-xs text-payzone-gold'>{line.portionSizeMl}ml portion</p> : null}
              </div>
            </div>
            <input
              className='col-span-2 rounded bg-payzone-navy/60 p-2'
              type='number'
              min='1'
              value={line.qty}
              onChange={(e) => updateLine(line.lineKey, { qty: Number(e.target.value) })}
            />
            <input
              className='col-span-3 rounded bg-payzone-navy/60 p-2'
              type='number'
              min='0'
              step='0.01'
              value={line.unitPrice}
              onChange={(e) => updateLine(line.lineKey, { unitPrice: Number(e.target.value) })}
            />
            <div className='col-span-2 text-right'>{(line.qty * line.unitPrice).toFixed(2)}</div>
            <button className='col-span-1 text-red-300' onClick={() => removeLine(line.lineKey)} type='button'>
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
              {m.name} — {m.accountNumber}
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
