import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";

const PaymentMethodsTab = () => {
  const { methods, fetchMethods, createMethod, updateMethod } = usePaymentMethodStore();
  const [form, setForm] = useState({
    name: "",
    accountNumber: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMethods({ scope: "admin" });
  }, [fetchMethods]);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!imageFile) {
      toast.error("Image is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("accountNumber", form.accountNumber);
      payload.append("isActive", String(form.isActive));
      payload.append("image", imageFile);
      await createMethod(payload);
      toast.success("Payment method created");
      setForm({
        name: "",
        accountNumber: "",
        isActive: true,
      });
      setImageFile(null);
      await fetchMethods({ scope: "admin" });
    } catch (error) {
      console.error("Failed to create payment method", error, error?.response?.data);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create payment method";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={submit} className='rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Name' value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required/>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Account number' value={form.accountNumber} onChange={(e)=>setForm({...form, accountNumber:e.target.value})} required/>
        <input
          type='file'
          accept='image/*'
          className='rounded bg-payzone-navy/60 p-2 text-white file:mr-3 file:rounded file:border-0 file:bg-payzone-gold file:px-3 file:py-1 file:text-payzone-navy'
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
        />
        <label className='text-white flex items-center gap-2'><input type='checkbox' checked={form.isActive} onChange={(e)=>setForm({...form, isActive:e.target.checked})}/> Active</label>
        <button
          type='submit'
          className='rounded bg-payzone-gold text-payzone-navy font-semibold disabled:cursor-not-allowed disabled:opacity-70'
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Method"}
        </button>
      </form>

      <div className='space-y-2'>
        {methods.map((m)=><div key={m._id} className='rounded border border-white/10 bg-white/5 p-3 flex items-center justify-between text-white'>
          <div className='flex items-center gap-3'>
            {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className='h-10 w-10 rounded object-cover' /> : null}
            <div>{m.name} — {m.accountNumber}</div>
          </div>
          <button
            className='rounded px-3 py-1 bg-white/10'
            onClick={async () => {
              try {
                await updateMethod(m._id, { isActive: !m.isActive });
                await fetchMethods({ scope: "admin" });
              } catch (error) {
                console.error("Failed to update payment method", error, error?.response?.data);
                toast.error(error?.response?.data?.message || "Failed to update payment method");
              }
            }}
          >
            {m.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>)}
      </div>
    </div>
  );
};

export default PaymentMethodsTab;
