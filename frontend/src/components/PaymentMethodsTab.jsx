import { useEffect, useState } from "react";
import { usePaymentMethodStore } from "../stores/usePaymentMethodStore";

const PaymentMethodsTab = () => {
  const { methods, fetchMethods, createMethod, updateMethod } = usePaymentMethodStore();
  const [form, setForm] = useState({ name: "", accountNumber: "", image: "", isActive: true });

  useEffect(() => { fetchMethods(false); }, [fetchMethods]);

  const submit = async (e) => {
    e.preventDefault();
    await createMethod(form);
    setForm({ name: "", accountNumber: "", image: "", isActive: true });
    fetchMethods(false);
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={submit} className='rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-5 gap-3'>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Name' value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required/>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Account number' value={form.accountNumber} onChange={(e)=>setForm({...form, accountNumber:e.target.value})} required/>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Image URL' value={form.image} onChange={(e)=>setForm({...form, image:e.target.value})}/>
        <label className='text-white flex items-center gap-2'><input type='checkbox' checked={form.isActive} onChange={(e)=>setForm({...form, isActive:e.target.checked})}/> Active</label>
        <button className='rounded bg-payzone-gold text-payzone-navy font-semibold'>Add Method</button>
      </form>

      <div className='space-y-2'>
        {methods.map((m)=><div key={m._id} className='rounded border border-white/10 bg-white/5 p-3 flex items-center justify-between text-white'>
          <div>{m.name} — {m.accountNumber}</div>
          <button className='rounded px-3 py-1 bg-white/10' onClick={async ()=>{await updateMethod(m._id,{isActive:!m.isActive}); fetchMethods(false);}}>{m.isActive?"Deactivate":"Activate"}</button>
        </div>)}
      </div>
    </div>
  );
};

export default PaymentMethodsTab;
