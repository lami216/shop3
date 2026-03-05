import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "../stores/useOrderStore";

const PortionSalesTab = () => {
  const { portionSales, fetchPortionSales } = useOrderStore();
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchPortionSales();
  }, [fetchPortionSales]);

  return (
    <div className='space-y-3'>
      {portionSales.map((group, index) => {
        const key = `${group.productId}-${group.portionSizeMl}-${index}`;
        const isOpen = Boolean(expanded[key]);

        return (
          <div key={key} className='rounded-xl border border-white/10 bg-white/5 p-4 text-white'>
            <button
              type='button'
              onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
              className='w-full text-right'
            >
              <p className='font-semibold'>{group.productName}</p>
              <p className='text-sm opacity-80'>{group.portionSizeMl}ml × {group.totalQuantity} تقسيمات</p>
            </button>

            {isOpen && (
              <div className='mt-3 space-y-2 border-t border-white/10 pt-3 text-sm'>
                {group.entries.map((entry) => (
                  <div key={entry.id} className='flex items-center justify-between'>
                    <span>{group.portionSizeMl}ml — Order #{entry.orderNumber || String(entry.orderId).slice(-4)}</span>
                    <Link
                      to={entry.orderTrackingCode ? `/order/${entry.orderTrackingCode}` : "#"}
                      className='rounded border border-payzone-gold/50 px-2 py-1 text-xs text-payzone-gold disabled:opacity-50'
                    >
                      فتح الطلب
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {portionSales.length === 0 && (
        <div className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70'>
          لا توجد تقسيمات مباعة بعد.
        </div>
      )}
    </div>
  );
};

export default PortionSalesTab;
