import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useInventoryStore } from "../stores/useInventoryStore";

const createEmptyForm = () => ({ productId: "", quantity: "", bottles_count: "", unitCost: "" });

const InventoryTab = () => {
  const { adminItems, fetchAdminOverview, createIntake } = useInventoryStore();
  const [entry, setEntry] = useState(createEmptyForm());
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminOverview();
  }, [fetchAdminOverview]);

  const selectedProduct = useMemo(() => adminItems.find((item) => item.product?._id === entry.productId)?.product, [adminItems, entry.productId]);
  const isPortionProduct = Boolean(selectedProduct?.hasPortions);

  const addRow = () => {
    if (!entry.productId) return toast.error("اختر منتج");
    const unitCost = Number(entry.unitCost);
    if (Number.isNaN(unitCost) || unitCost < 0) return toast.error("أدخل تكلفة شراء صحيحة");

    if (isPortionProduct) {
      const bottlesCount = Number(entry.bottles_count);
      if (Number.isNaN(bottlesCount) || bottlesCount <= 0) return toast.error("أدخل عدد الزجاجات");
      setRows((prev) => [...prev, { productId: entry.productId, bottles_count: bottlesCount, quantity: bottlesCount, unitCost }]);
    } else {
      const quantity = Number(entry.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) return toast.error("أدخل كمية صحيحة");
      setRows((prev) => [...prev, { productId: entry.productId, quantity, unitCost }]);
    }

    setEntry(createEmptyForm());
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rows.length) return toast.error("أضف بندًا واحدًا على الأقل");
    setSaving(true);
    try {
      await createIntake({ invoiceDate: new Date().toISOString(), items: rows.map((row) => ({ product: row.productId, quantity: row.quantity, bottles_count: row.bottles_count, unitCost: row.unitCost })) });
      toast.success("تم حفظ إدخال المخزون");
      setRows([]);
      await fetchAdminOverview();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={submit} className='rounded-xl border border-white/10 bg-white/5 p-4 space-y-3'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-2 items-end'>
          <select className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-2' value={entry.productId} onChange={(e) => setEntry((prev) => ({ ...prev, productId: e.target.value }))}>
            <option value=''>اختر المنتج</option>
            {adminItems.map((item) => <option key={item.product._id} value={item.product._id}>{item.product.name}</option>)}
          </select>
          {isPortionProduct ? (
            <input className='rounded bg-payzone-navy/60 p-2 text-white' type='number' placeholder='عدد الزجاجات' value={entry.bottles_count} onChange={(e) => setEntry((prev) => ({ ...prev, bottles_count: e.target.value }))} />
          ) : (
            <input className='rounded bg-payzone-navy/60 p-2 text-white' type='number' placeholder='الكمية' value={entry.quantity} onChange={(e) => setEntry((prev) => ({ ...prev, quantity: e.target.value }))} />
          )}
          <input className='rounded bg-payzone-navy/60 p-2 text-white' type='number' placeholder='سعر الشراء لكل زجاجة/وحدة' value={entry.unitCost} onChange={(e) => setEntry((prev) => ({ ...prev, unitCost: e.target.value }))} />
        </div>
        <button type='button' className='rounded bg-payzone-gold px-3 py-2 text-black' onClick={addRow}>إضافة</button>

        {rows.length > 0 && (
          <div className='space-y-2 text-white/90'>
            {rows.map((row, index) => (
              <div key={`${row.productId}-${index}`} className='flex items-center justify-between rounded bg-white/5 p-2'>
                <span>{adminItems.find((x) => x.product._id === row.productId)?.product?.name}</span>
                <span>{row.bottles_count ? `${row.bottles_count} زجاجات` : `${row.quantity} وحدة`} - {row.unitCost}</span>
              </div>
            ))}
          </div>
        )}

        <button disabled={saving} className='rounded bg-emerald-500 px-4 py-2 text-white disabled:opacity-50'>{saving ? "جاري الحفظ..." : "حفظ الإدخال"}</button>
      </form>

      <div className='space-y-3'>
        {adminItems.map((item) => (
          <div key={item.product._id} className='rounded border border-white/10 bg-white/5 p-3 text-white'>
            <p className='font-semibold'>{item.product.name}</p>
            {item.product.hasPortions ? (
              <>
                <p className='text-sm text-white/70'>المتبقي بالملي: {Number(item.product.totalStockMl || 0)}</p>
                <div className='text-xs text-white/70'>
                  {(item.estimatedPortions || []).map((estimate) => <p key={estimate.size_ml}>{estimate.size_ml}ml → {estimate.remaining} تقسيمات</p>)}
                </div>
              </>
            ) : (
              <p className='text-sm text-white/70'>المتاح: {item.availableQuantity}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryTab;
