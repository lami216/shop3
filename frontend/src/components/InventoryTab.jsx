import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { formatMRU } from "../lib/formatMRU";
import { formatDateTimeFr } from "../lib/localeFormat";
import { useInventoryStore } from "../stores/useInventoryStore";

const createEmptyRow = () => ({ productId: "", quantity: "", unitCost: "", unitPrice: "" });

const InventoryTab = () => {
  const { adminItems, intakes, fetchAdminOverview, createIntake, fetchIntakes } = useInventoryStore();
  const [reference, setReference] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [rows, setRows] = useState([createEmptyRow()]);
  const [selectedIntakeId, setSelectedIntakeId] = useState("");

  useEffect(() => {
    fetchAdminOverview();
    fetchIntakes();
  }, [fetchAdminOverview, fetchIntakes]);

  const selectedIntake = useMemo(() => intakes.find((intake) => intake._id === selectedIntakeId) || null, [intakes, selectedIntakeId]);

  const updateRow = (index, patch) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
  const removeRow = (index) => setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const submit = async (e) => {
    e.preventDefault();

    const payloadItems = rows
      .map((row) => ({
        product: row.productId,
        quantity: Number(row.quantity),
        unitCost: Number(row.unitCost),
        unitPrice: row.unitPrice === "" ? undefined : Number(row.unitPrice),
      }))
      .filter((row) => row.product);

    if (!payloadItems.length) {
      toast.error("أضف منتجًا واحدًا على الأقل");
      return;
    }

    const hasInvalid = payloadItems.some(
      (item) => !item.product || Number.isNaN(item.quantity) || item.quantity <= 0 || Number.isNaN(item.unitCost) || item.unitCost < 0
    );

    if (hasInvalid) {
      toast.error("يرجى تصحيح الكمية وتكلفة الوحدة لكل منتج");
      return;
    }

    await createIntake({ invoiceDate: invoiceDate || undefined, reference, items: payloadItems });
    toast.success("تم حفظ إدخال المخزون");
    setRows([createEmptyRow()]);
    setReference("");
    setInvoiceDate("");
    await Promise.all([fetchAdminOverview(), fetchIntakes()]);
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={submit} className='rounded-xl border border-white/10 bg-white/5 p-4 space-y-3'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <input
            className='rounded bg-payzone-navy/60 p-2 text-white'
            placeholder='المرجع (اختياري)'
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <input className='rounded bg-payzone-navy/60 p-2 text-white' type='date' value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>

        {rows.map((row, index) => (
          <div key={`inventory-row-${index}`} className='grid grid-cols-1 md:grid-cols-12 gap-2 items-center'>
            <select
              className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-5'
              value={row.productId}
              onChange={(e) => updateRow(index, { productId: e.target.value })}
            >
              <option value=''>اختر منتجًا</option>
              {adminItems.map((item) => (
                <option key={item.product._id} value={item.product._id}>
                  {item.product.name}
                </option>
              ))}
            </select>
            <input
              className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-2'
              placeholder='الكمية'
              type='number'
              min='1'
              value={row.quantity}
              onChange={(e) => updateRow(index, { quantity: e.target.value })}
            />
            <input
              className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-2'
              placeholder='تكلفة الوحدة'
              type='number'
              min='0'
              step='0.01'
              value={row.unitCost}
              onChange={(e) => updateRow(index, { unitCost: e.target.value })}
            />
            <input
              className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-2'
              placeholder='سعر البيع (اختياري)'
              type='number'
              min='0'
              step='0.01'
              value={row.unitPrice}
              onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
            />
            <button type='button' className='rounded border border-red-300/40 px-2 py-2 text-red-200 md:col-span-1' onClick={() => removeRow(index)}>
              حذف
            </button>
          </div>
        ))}

        <div className='flex flex-wrap gap-2'>
          <button type='button' className='rounded border border-payzone-gold/50 px-3 py-2 text-payzone-gold' onClick={addRow}>
            + إضافة منتج
          </button>
          <button className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy'>حفظ</button>
        </div>
      </form>

      <div className='overflow-auto rounded-xl border border-white/10'>
        <table className='min-w-full text-sm text-white'>
          <thead className='bg-white/10'><tr><th className='p-2 text-left'>Product</th><th>Total</th><th>Reserved</th><th>Available</th></tr></thead>
          <tbody>
            {adminItems.map((row) => (<tr key={row.product._id} className='border-t border-white/10'>
              <td className='p-2'>{row.product.name}</td>
              <td className='text-center'>{row.totalQuantity}</td>
              <td className='text-center'>{row.reservedQuantity}</td>
              <td className='text-center'>{row.availableQuantity}</td>
            </tr>))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 rounded-xl border border-white/10 bg-white/5 p-4'>
        <h3 className='text-lg font-semibold text-payzone-gold'>سجل إدخالات المخزون</h3>
        <div className='overflow-auto rounded border border-white/10'>
          <table className='min-w-full text-sm text-white'>
            <thead className='bg-white/10'>
              <tr>
                <th className='p-2 text-left'>التاريخ</th>
                <th className='p-2 text-center'>عدد البنود</th>
                <th className='p-2 text-center'>إجمالي الكمية</th>
                <th className='p-2 text-left'>المرجع</th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((intake) => (
                <tr
                  key={intake._id}
                  className='cursor-pointer border-t border-white/10 hover:bg-white/5'
                  onClick={() => setSelectedIntakeId(intake._id)}
                >
                  <td className='p-2'>{formatDateTimeFr(intake.invoiceDate || intake.createdAt)}</td>
                  <td className='p-2 text-center'>{intake.items?.length || 0}</td>
                  <td className='p-2 text-center'>{intake.totalQuantity || 0}</td>
                  <td className='p-2'>{intake.reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedIntake ? (
          <div className='rounded border border-payzone-gold/30 p-3'>
            <p className='mb-2 text-payzone-gold'>تفاصيل الإدخال</p>
            <div className='space-y-1 text-sm'>
              <p>التاريخ: {formatDateTimeFr(selectedIntake.invoiceDate || selectedIntake.createdAt)}</p>
              <p>المرجع: {selectedIntake.reference || "—"}</p>
              <p>إجمالي التكلفة: {formatMRU(selectedIntake.totalCost || 0)}</p>
            </div>
            <div className='mt-2 space-y-1'>
              {(selectedIntake.items || []).map((item, index) => (
                <p key={`${item.product?._id || item.product}-${index}`} className='text-sm text-white/80'>
                  {item.product?.name || "—"} — Qty: {item.quantity} — Unit Cost: {formatMRU(item.unitCost || 0)}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InventoryTab;
