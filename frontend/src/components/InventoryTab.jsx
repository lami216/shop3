import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useInventoryStore } from "../stores/useInventoryStore";

const createEmptyForm = () => ({ productId: "", quantity: "", unitCost: "" });
const formatFrNumber = (value) => new Intl.NumberFormat("fr-FR").format(Number(value) || 0);
const formatFrDate = (value) => new Date(value).toLocaleDateString("fr-FR");

const InventoryTab = () => {
  const { adminItems, intakes, fetchAdminOverview, createIntake, fetchIntakes } = useInventoryStore();
  const [reference, setReference] = useState("");
  const [entry, setEntry] = useState(createEmptyForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [selectedIntakeId, setSelectedIntakeId] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchAdminOverview();
    fetchIntakes();
  }, [fetchAdminOverview, fetchIntakes]);

  const todayLabel = useMemo(() => new Date().toLocaleDateString("fr-FR"), []);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return adminItems;
    return adminItems.filter((item) => item.product?.name?.toLowerCase().includes(query));
  }, [adminItems, searchTerm]);

  const totals = useMemo(() => {
    const itemCount = rows.length;
    const totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const totalCost = rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unitCost || 0), 0);
    return { itemCount, totalQuantity, totalCost };
  }, [rows]);

  const resetForm = () => {
    setEntry(createEmptyForm());
    setSearchTerm("");
    setEditingIndex(-1);
    searchInputRef.current?.focus();
  };

  const validateEntry = () => {
    if (!entry.productId) {
      toast.error("اختر منتج");
      return false;
    }
    const qty = Number(entry.quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("أدخل كمية صحيحة");
      return false;
    }
    const cost = Number(entry.unitCost);
    if (Number.isNaN(cost) || cost < 0) {
      toast.error("أدخل تكلفة صحيحة");
      return false;
    }
    return true;
  };

  const hasDuplicateProduct = (productId) => rows.some((row, index) => row.productId === productId && index !== editingIndex);

  const upsertItem = () => {
    if (!validateEntry()) return;
    if (hasDuplicateProduct(entry.productId)) {
      toast.error("المنتج موجود بالفعل في القائمة");
      return;
    }

    const normalizedItem = {
      productId: entry.productId,
      quantity: Number(entry.quantity),
      unitCost: Number(entry.unitCost),
    };

    if (editingIndex >= 0) {
      setRows((prev) => prev.map((row, index) => (index === editingIndex ? normalizedItem : row)));
    } else {
      setRows((prev) => [...prev, normalizedItem]);
    }
    resetForm();
  };

  const startEdit = (index) => {
    const row = rows[index];
    if (!row) return;
    setEditingIndex(index);
    setEntry({ productId: row.productId, quantity: String(row.quantity), unitCost: String(row.unitCost) });
    setSearchTerm(adminItems.find((item) => item.product._id === row.productId)?.product?.name || "");
    searchInputRef.current?.focus();
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      resetForm();
    } else if (editingIndex > index) {
      setEditingIndex((prev) => prev - 1);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!rows.length) {
      toast.error("أضف منتجًا واحدًا على الأقل");
      return;
    }

    setSaving(true);
    try {
      await createIntake({
        invoiceDate: new Date().toISOString(),
        reference,
        items: rows.map((row) => ({ product: row.productId, quantity: row.quantity, unitCost: row.unitCost })),
      });
      toast.success("تم حفظ إدخال المخزون");
      setRows([]);
      setReference("");
      resetForm();
      await Promise.all([fetchAdminOverview(), fetchIntakes()]);
    } finally {
      setSaving(false);
    }
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
          <div className='rounded bg-payzone-navy/60 p-2 text-white/90'>التاريخ: {todayLabel}</div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-12 gap-2 items-end'>
          <div className='md:col-span-5 space-y-2'>
            <input
              ref={searchInputRef}
              className='w-full rounded bg-payzone-navy/60 p-2 text-white'
              placeholder='ابحث باسم المنتج…'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className='w-full rounded bg-payzone-navy/60 p-2 text-white'
              value={entry.productId}
              onChange={(e) => setEntry((prev) => ({ ...prev, productId: e.target.value }))}
            >
              <option value=''>اختر منتجًا</option>
              {filteredProducts.map((item) => (
                <option key={item.product._id} value={item.product._id}>
                  {item.product.name}
                </option>
              ))}
            </select>
          </div>
          <input
            className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-2'
            placeholder='الكمية'
            type='number'
            min='1'
            value={entry.quantity}
            onChange={(e) => setEntry((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          <input
            className='rounded bg-payzone-navy/60 p-2 text-white md:col-span-2'
            placeholder='تكلفة الوحدة'
            type='number'
            min='0'
            step='0.01'
            value={entry.unitCost}
            onChange={(e) => setEntry((prev) => ({ ...prev, unitCost: e.target.value }))}
          />
          <button
            type='button'
            className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy disabled:opacity-60 md:col-span-1'
            onClick={upsertItem}
            disabled={saving}
          >
            {editingIndex >= 0 ? "تحديث" : "إضافة"}
          </button>
          {editingIndex >= 0 ? (
            <button
              type='button'
              className='rounded border border-payzone-gold/50 px-3 py-2 text-payzone-gold md:col-span-2'
              onClick={resetForm}
              disabled={saving}
            >
              إلغاء التعديل
            </button>
          ) : null}
        </div>

        <div className='overflow-auto rounded border border-white/10'>
          <table className='min-w-full text-sm text-white'>
            <thead className='bg-white/10'>
              <tr>
                <th className='p-2 text-left'>المنتج</th>
                <th className='p-2 text-center'>الكمية</th>
                <th className='p-2 text-center'>تكلفة الوحدة</th>
                <th className='p-2 text-center'>الإجمالي</th>
                <th className='p-2 text-center'>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row, index) => {
                  const productName = adminItems.find((item) => item.product._id === row.productId)?.product?.name || "—";
                  return (
                    <tr key={`${row.productId}-${index}`} className='border-t border-white/10'>
                      <td className='p-2'>{productName}</td>
                      <td className='p-2 text-center'>{formatFrNumber(row.quantity)}</td>
                      <td className='p-2 text-center'>{formatFrNumber(row.unitCost)}</td>
                      <td className='p-2 text-center'>{formatFrNumber(row.quantity * row.unitCost)}</td>
                      <td className='p-2 text-center'>
                        <div className='flex justify-center gap-2'>
                          <button type='button' className='rounded border border-payzone-gold/50 px-2 py-1 text-payzone-gold' onClick={() => startEdit(index)}>
                            تعديل
                          </button>
                          <button type='button' className='rounded border border-red-300/40 px-2 py-1 text-red-200' onClick={() => removeRow(index)}>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className='p-3 text-center text-white/70' colSpan={5}>
                    لا توجد عناصر مضافة بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='rounded border border-white/10 bg-payzone-navy/40 p-3 text-sm text-white/90'>
          <p>عدد الأصناف: {formatFrNumber(totals.itemCount)}</p>
          <p>مجموع الكميات: {formatFrNumber(totals.totalQuantity)}</p>
          <p>إجمالي التكلفة: {formatFrNumber(totals.totalCost)}</p>
        </div>

        <div className='flex flex-wrap gap-2 justify-end'>
          <button className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy disabled:opacity-60' disabled={!rows.length || saving}>
            {saving ? "...جاري الحفظ" : "حفظ"}
          </button>
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
                <th className='p-2 text-center'>إجمالي التكلفة</th>
                <th className='p-2 text-center'>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((intake) => (
                <Fragment key={intake._id}>
                  <tr className='border-t border-white/10 hover:bg-white/5'>
                    <td className='p-2'>{formatFrDate(intake.invoiceDate || intake.createdAt)}</td>
                    <td className='p-2 text-center'>{formatFrNumber(intake.items?.length || 0)}</td>
                    <td className='p-2 text-center'>{formatFrNumber(intake.totalCost || 0)}</td>
                    <td className='p-2 text-center'>
                      <button
                        type='button'
                        className='rounded border border-payzone-gold/50 px-2 py-1 text-payzone-gold'
                        onClick={() => setSelectedIntakeId((prev) => (prev === intake._id ? "" : intake._id))}
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                  {selectedIntakeId === intake._id ? (
                    <tr className='border-t border-white/10 bg-payzone-navy/40'>
                      <td className='p-2' colSpan={4}>
                        <div className='overflow-auto rounded border border-white/10'>
                          <table className='min-w-full text-sm text-white'>
                            <thead className='bg-white/10'>
                              <tr>
                                <th className='p-2 text-left'>المنتج</th>
                                <th className='p-2 text-center'>الكمية</th>
                                <th className='p-2 text-center'>تكلفة الوحدة</th>
                                <th className='p-2 text-center'>الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(intake.items || []).map((item, index) => (
                                <tr key={`${item.product?._id || item.product}-${index}`} className='border-t border-white/10'>
                                  <td className='p-2'>{item.product?.name || "—"}</td>
                                  <td className='p-2 text-center'>{formatFrNumber(item.quantity)}</td>
                                  <td className='p-2 text-center'>{formatFrNumber(item.unitCost || 0)}</td>
                                  <td className='p-2 text-center'>{formatFrNumber((item.quantity || 0) * (item.unitCost || 0))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;
