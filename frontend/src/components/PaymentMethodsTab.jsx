import { useEffect, useState } from "react";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";

const PaymentMethodsTab = () => {
  const { methods, fetchMethods, createMethod, updateMethod } = usePaymentMethodStore();
  const [form, setForm] = useState({
    name: "",
    accountNumber: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => { fetchMethods({ scope: "admin" }); }, [fetchMethods]);

  const submit = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("accountNumber", form.accountNumber);
    payload.append("isActive", String(form.isActive));
    payload.append("image", imageFile);
    await createMethod(payload);
    setForm({
      name: "",
      accountNumber: "",
      isActive: true,
    });
    setImageFile(null);
    fetchMethods({ scope: "admin" });
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
        <button className='rounded bg-payzone-gold text-payzone-navy font-semibold'>Add Method</button>
      </form>

      <div className='space-y-2'>
        {methods.map((m)=><div key={m._id} className='rounded border border-white/10 bg-white/5 p-3 flex items-center justify-between text-white'>
          <div className='flex items-center gap-3'>
            {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className='h-10 w-10 rounded object-cover' /> : null}
            <div>{m.name} — {m.accountNumber}</div>
          </div>
          <button className='rounded px-3 py-1 bg-white/10' onClick={async ()=>{await updateMethod(m._id,{isActive:!m.isActive}); fetchMethods({ scope: "admin" });}}>{m.isActive?"Deactivate":"Activate"}</button>
        </div>)}
      </div>
    </div>
  );
};

export default PaymentMethodsTab;
