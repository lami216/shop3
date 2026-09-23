import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import apiClient from "../lib/apiClient";
import { addGuestPendingOrder } from "../lib/guestPendingOrders";
import {
  consumeLegacyGuestOrderClaim,
  getLegacyClaimTokenFromHash,
  removeLegacyClaimTokenFromAddress,
} from "../lib/legacyGuestClaim";

const LegacyGuestClaimPage = () => {
  const { orderId } = useParams();
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const claimToken = getLegacyClaimTokenFromHash(hash);
    if (!orderId || !claimToken) {
      setError("رابط استرداد الطلب غير صالح أو منتهي الصلاحية");
      return;
    }

    removeLegacyClaimTokenFromAddress(window.history, { pathname, search });

    consumeLegacyGuestOrderClaim({
      apiClient,
      orderId,
      claimToken,
      persistGuestOrder: addGuestPendingOrder,
    })
      .then(({ trackingCode }) => navigate(`/order/${encodeURIComponent(trackingCode)}`, { replace: true }))
      .catch((claimError) => {
        setError(claimError.response?.data?.message || "رابط استرداد الطلب غير صالح أو منتهي الصلاحية");
      });
  }, [hash, navigate, orderId, pathname, search]);

  return (
    <main className='mx-auto max-w-xl px-4 py-16 text-center'>
      <section className='rounded-2xl bg-white p-8 shadow-sm'>
        {error ? (
          <>
            <h1 className='text-xl font-bold text-red-700'>تعذر استرداد الطلب</h1>
            <p className='mt-3 text-sm text-gray-600'>{error}</p>
            <Link className='mt-6 inline-flex rounded-xl border border-payzone-gold px-4 py-2 text-payzone-gold' to='/track'>
              تتبع طلب آخر
            </Link>
          </>
        ) : (
          <>
            <h1 className='text-xl font-bold text-gray-900'>جاري استرداد طلبك</h1>
            <p className='mt-3 text-sm text-gray-600'>يرجى الانتظار للحظة…</p>
          </>
        )}
      </section>
    </main>
  );
};

export default LegacyGuestClaimPage;
