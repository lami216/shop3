import { Link, useLocation } from "react-router-dom";

const PurchaseSuccessPage = () => {
  const location = useLocation();
  const order = location.state?.order || null;

  return (
    <div className='container mx-auto px-4 py-16 text-white max-w-3xl'>
      <div className='rounded-xl border border-white/10 bg-white/5 p-6'>
        <h1 className='text-3xl font-bold text-payzone-gold mb-4'>Payment proof submitted</h1>
        <p className='text-white/80 mb-6'>Your payment proof has been sent for review by the admin team.</p>

        {order ? (
          <div className='rounded-lg border border-payzone-gold/30 bg-payzone-navy/50 p-4 space-y-2 mb-6'>
            <p>Order Number: <span className='font-semibold text-payzone-gold'>{order.orderNumber}</span></p>
            <p>Tracking Code: <span className='font-semibold text-payzone-gold'>{order.trackingCode}</span></p>
            <p>Status: <span className='font-semibold'>{order.status}</span></p>
          </div>
        ) : null}

        <div className='flex flex-wrap gap-3'>
          {order?.trackingCode ? (
            <Link className='rounded bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy' to={`/track-order?code=${order.trackingCode}`}>
              Track this order
            </Link>
          ) : null}
          <Link className='rounded border border-white/30 px-4 py-2' to='/my-orders'>My Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
