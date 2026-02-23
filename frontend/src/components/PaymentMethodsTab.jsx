import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";

const PaymentMethodsTab = () => {
  const { methods, fetchMethods, createMethod, updateMethod, deleteMethod } = usePaymentMethodStore();
  const [form, setForm] = useState({ name: "", accountNumber: "", isActive: true });
  const [editingId, setEditingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMethods({ includeInactive: true });
  }, [fetchMethods]);

  const resetForm = () => {
    setForm({ name: "", accountNumber: "", isActive: true });
    setEditingId("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        accountNumber: form.accountNumber,
        isActive: form.isActive,
      };

      if (editingId) {
        await updateMethod(editingId, payload);
        toast.success("Payment method updated");
      } else {
        await createMethod(payload);
        toast.success("Payment method created");
      }

      resetForm();
      await fetchMethods({ includeInactive: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save payment method");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={submit} className='grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-2'>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Account number' value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
        <label className='flex items-center gap-2 text-white'><input type='checkbox' checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        <div className='flex gap-2'>
          <button type='submit' className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy disabled:opacity-70' disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update Method" : "Add Method"}
          </button>
          {editingId ? <button type='button' className='rounded bg-white/10 px-4 py-2 text-white' onClick={resetForm}>Cancel</button> : null}
        </div>
      </form>

      <div className='space-y-2'>
        {methods.map((m) => (
          <div key={m._id} className='flex items-center justify-between rounded border border-white/10 bg-white/5 p-3 text-white'>
            <div>
              <div>{m.name} — {m.accountNumber}</div>
              <div className='text-xs text-white/70'>{m.isActive ? "Active" : "Inactive"}</div>
            </div>
            <div className='flex gap-2'>
              <button
                className='rounded bg-white/10 px-3 py-1'
                onClick={() => {
                  setEditingId(m._id);
                  setForm({ name: m.name, accountNumber: m.accountNumber, isActive: m.isActive });
                }}
              >
                Edit
              </button>
              <button
                className='rounded bg-red-500/20 px-3 py-1 text-red-200'
                onClick={async () => {
                  try {
                    await deleteMethod(m._id);
                    toast.success("Payment method deleted");
                    await fetchMethods({ includeInactive: true });
                  } catch (error) {
                    toast.error(error?.response?.data?.message || "Failed to delete payment method");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodsTab;
