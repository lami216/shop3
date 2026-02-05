import { useEffect, useState } from "react";
import { useInventoryStore } from "../stores/useInventoryStore";

const InventoryTab = () => {
  const { adminItems, fetchAdminOverview, addBatch } = useInventoryStore();
  const [form, setForm] = useState({ productId: "", quantity: "", purchasePrice: "" });

  useEffect(() => {
    fetchAdminOverview();
  }, [fetchAdminOverview]);

  const submit = async (e) => {
    e.preventDefault();
    await addBatch({ ...form, quantity: Number(form.quantity), purchasePrice: Number(form.purchasePrice) });
    setForm({ productId: "", quantity: "", purchasePrice: "" });
    fetchAdminOverview();
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={submit} className='rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
        <select className='rounded bg-payzone-navy/60 p-2 text-white' value={form.productId} onChange={(e)=>setForm({...form, productId:e.target.value})} required>
          <option value=''>Select product</option>
          {adminItems.map((item)=><option key={item.product._id} value={item.product._id}>{item.product.name}</option>)}
        </select>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Quantity' type='number' min='1' value={form.quantity} onChange={(e)=>setForm({...form, quantity:e.target.value})} required/>
        <input className='rounded bg-payzone-navy/60 p-2 text-white' placeholder='Purchase price' type='number' min='0' step='0.01' value={form.purchasePrice} onChange={(e)=>setForm({...form, purchasePrice:e.target.value})} required/>
        <button className='rounded bg-payzone-gold text-payzone-navy font-semibold'>Add Batch</button>
      </form>

      <div className='overflow-auto rounded-xl border border-white/10'>
        <table className='min-w-full text-sm text-white'>
          <thead className='bg-white/10'><tr><th className='p-2 text-left'>Product</th><th>Total</th><th>Reserved</th><th>Available</th></tr></thead>
          <tbody>
            {adminItems.map((row)=>(<tr key={row.product._id} className='border-t border-white/10'>
              <td className='p-2'>{row.product.name}</td>
              <td className='text-center'>{row.totalQuantity}</td>
              <td className='text-center'>{row.reservedQuantity}</td>
              <td className='text-center'>{row.availableQuantity}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTab;
