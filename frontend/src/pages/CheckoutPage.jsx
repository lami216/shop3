import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";
import { getProductPricing } from "../lib/getProductPricing";
import { useOrderStore } from "../stores/useOrderStore";
import apiClient from "../lib/apiClient";
import { useUserStore } from "../stores/useUserStore";
import { addGuestPendingOrder } from "../lib/guestPendingOrders";

const CheckoutPage = () => {
  const { cart, total, subtotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const { t } = useTranslation();
  const { createOrder } = useOrderStore();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (cart.length === 0) {
      toast.error(t("common.messages.cartEmptyToast"));
      navigate("/cart", { replace: true });
    }
  }, [cart, navigate, t]);

  useEffect(() => {
    const loadMethods = async () => {
      try {
        const data = await apiClient.get("/payment-methods");
        const methods = data.methods || [];
        setPaymentMethods(methods);
        setPaymentMethodId(methods[0]?._id || "");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load payment methods");
      }
    };
    loadMethods();
  }, []);

  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = /^\d{8}$/.test(normalizedPhoneNumber);
  const isFormValid = customerName.trim() !== "" && address.trim() !== "" && cart.length > 0 && isPhoneValid && !!paymentMethodId;
  const savings = Math.max(subtotal - total, 0);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!customerName.trim() || !phoneNumber.trim() || !address.trim()) {
      toast.error(t("common.messages.fillAllFields"));
      return;
    }

    if (!/^\d{8}$/.test(normalizedPhoneNumber)) {
      toast.error(t("common.messages.whatsAppInvalid"));
      return;
    }

    if (!paymentMethodId) {
      toast.error("اختر وسيلة دفع");
      return;
    }

    if (cart.length === 0) {
      toast.error(t("common.messages.cartEmpty"));
      navigate("/cart");
      return;
    }

    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        phone: normalizedPhoneNumber,
        address: address.trim(),
        paymentMethodId,
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          type: String(item.type || item.cartType || "full") === "portion" ? "portion" : "full",
          portionSizeMl: item.portionSizeMl ?? null,
        })),
      });
      await clearCart();
      if (!user) {
        addGuestPendingOrder(order.trackingCode);
      }
      navigate(`/pay/${order.trackingCode}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create order");
    }
  };

  return (
    <div className='bg-[#fafafa] py-10 sm:py-12'>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 lg:flex-row'>
        <section className='w-full rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm'>
          <h1 className='mb-6 text-2xl font-bold text-[#111111]'>{t("checkout.title")}</h1>
          <form className='space-y-5' onSubmit={handleSubmit}>
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-[#111111]' htmlFor='customerName'>{t("checkout.form.fullName")}</label>
              <input id='customerName' type='text' value={customerName} onChange={(event) => setCustomerName(event.target.value)} className='w-full rounded-lg border border-brand-primary/20 bg-white px-4 py-2.5 text-[#111111] placeholder:text-brand-muted focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-gold/40' placeholder={t("checkout.form.fullNamePlaceholder")} required />
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-[#111111]' htmlFor='phoneNumber'>{t("checkout.form.whatsApp")}</label>
              <input id='phoneNumber' type='tel' value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className='w-full rounded-lg border border-brand-primary/20 bg-white px-4 py-2.5 text-[#111111] placeholder:text-brand-muted focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-gold/40' placeholder={t("checkout.form.whatsAppPlaceholder")} required />
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-[#111111]' htmlFor='address'>{t("checkout.form.address")}</label>
              <textarea id='address' value={address} onChange={(event) => setAddress(event.target.value)} rows={4} className='w-full rounded-lg border border-brand-primary/20 bg-white px-4 py-2.5 text-[#111111] placeholder:text-brand-muted focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-gold/40' placeholder={t("checkout.form.addressPlaceholder")} required />
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-[#111111]'>اختر وسيلة الدفع</label>
              {paymentMethods.length === 0 ? (
                <p className='rounded-lg border border-brand-primary/20 bg-[#fafafa] px-3 py-2 text-sm text-brand-muted'>لا توجد وسائل دفع متاحة حالياً</p>
              ) : (
                <select
                  className='w-full rounded-lg border border-brand-primary/20 bg-white px-4 py-2.5 text-[#111111] focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-gold/40'
                  value={paymentMethodId}
                  onChange={(event) => setPaymentMethodId(event.target.value)}
                  required
                >
                  {paymentMethods.map((method) => (
                    <option key={method._id} value={method._id}>
                      {method.name} — {method.accountNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button type='submit' disabled={!isFormValid} className='mt-2 w-full rounded-xl bg-payzone-gold px-5 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#b8873d] focus:outline-none focus:ring-2 focus:ring-payzone-gold/40 disabled:opacity-50'>
              متابعة الدفع
            </button>
          </form>
        </section>

        <aside className='w-full rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm lg:max-w-sm'>
          <h2 className='text-xl font-semibold text-[#111111]'>{t("checkout.summary.title")}</h2>
          <ul className='mt-4 space-y-3 text-sm text-[#6b7280]'>
            {cart.map((item) => {
              const { price, discountedPrice, isDiscounted } = getProductPricing(item);
              return (
                <li key={item._id} className='flex justify-between gap-4'>
                  <span className='font-medium text-[#111111]'>{item.cartLineName || item.name}</span>
                  <span className='flex flex-col items-end'>
                    {String(item.type || item.cartType || "full") !== "portion" && isDiscounted && <span className='text-xs text-[#6b7280] line-through'>{formatNumberEn(item.quantity)} × {formatMRU(price)}</span>}
                    <span>{formatNumberEn(item.quantity)} × {formatMRU(String(item.type || item.cartType || "full") === "portion" ? Number(item.cartUnitPrice ?? item.price ?? 0) : discountedPrice)}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className='mt-6 space-y-2 border-t border-brand-primary/10 pt-4 text-sm text-[#6b7280]'>
            <div className='flex justify-between'><span>{t("checkout.summary.subtotal")}</span><span>{formatMRU(subtotal)}</span></div>
            {savings > 0 && <div className='flex justify-between text-payzone-gold'><span>{t("checkout.summary.savings")}</span><span>-{formatMRU(savings)}</span></div>}
            <div className='flex justify-between text-base font-semibold text-[#111111]'><span>{t("checkout.summary.total")}</span><span>{formatMRU(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
