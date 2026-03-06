import { Facebook, Ghost, MessageCircle, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";

const TikTokIcon = ({ size = 18 }) => (
  <svg viewBox='0 0 24 24' width={size} height={size} fill='currentColor' aria-hidden='true'>
    <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3.4v13.39a2.9 2.9 0 1 1-2-2.77V9.62a6.3 6.3 0 1 0 5.39 6.21V9.03a8.2 8.2 0 0 0 4.79 1.53V6.69Z' />
  </svg>
);

const socialItems = [
  { label: "TikTok", href: "https://www.tiktok.com/@al_sahib_dd?_r=1&_t=ZS-94T5ZgItWbp", icon: TikTokIcon },
  { label: "Snapchat", href: "https://snapchat.com/t/y9IRV5pR", icon: Ghost },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=100092359748442", icon: Facebook },
  { label: "WhatsApp", href: "https://wa.me/22242723477", icon: MessageCircle },
  { label: "Phone Call", href: "tel:+22242723477", icon: PhoneCall },
];

const paymentMethods = ["pay1", "pay2", "pay3", "pay4"];

const Footer = () => {
  return (
    <footer className='mt-24 border-t border-white/10 bg-black/80 text-brand-text'>
      <div className='mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6' dir='rtl'>
        <div className='grid gap-8 md:grid-cols-3'>
          <section className='mx-auto space-y-2 text-center'>
            <h3 className='text-gradient-gold text-2xl font-semibold'>الصاحب</h3>
            <p className='text-sm text-brand-muted'>رحلة حسية في عالم العطور الفاخرة</p>
          </section>

          <section className='space-y-3'>
            <h4 className='text-lg font-semibold'>روابط مهمة</h4>
            <div className='flex flex-col gap-2 text-sm text-brand-muted'>
              <Link to='/about' className='transition hover:text-brand-text'>
                من نحن
              </Link>
              <Link to='/privacy' className='transition hover:text-brand-text'>
                سياسة الخصوصية
              </Link>
            </div>
          </section>

          <section className='space-y-3'>
            <h4 className='text-lg font-semibold'>تواصل معنا</h4>
            <a
              href='https://wa.me/22242723477'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex w-fit items-center gap-2 rounded-full border border-[#d4af37] bg-transparent px-4 py-2 text-sm font-medium text-[#d4af37] transition'
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </section>
        </div>

        <hr className='w-full opacity-20' style={{ marginTop: "30px", marginBottom: "30px" }} />

        <section className='space-y-3'>
          <h4 className='text-lg font-semibold'>تابعنا</h4>
          <div className='flex items-center gap-4'>
            {socialItems.map(({ label, href, icon: Icon }) => {
              const isPhone = href.startsWith("tel:");
              return (
                <a
                  key={label}
                  href={href}
                  className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-brand-muted transition hover:border-brand-primary hover:text-brand-primary'
                  aria-label={label}
                  target={isPhone ? undefined : "_blank"}
                  rel={isPhone ? undefined : "noopener noreferrer"}
                >
                  <Icon size={18} strokeWidth={2.1} />
                </a>
              );
            })}
          </div>
        </section>

        <section>
          <div className='payment-methods'>
            {paymentMethods.map((method) => (
              <div key={method} className='payment-card'>
                <img src={`/payments/${method}.png`} alt={method} loading='lazy' />
              </div>
            ))}
          </div>
        </section>

        <p className='text-center text-sm text-brand-muted'>© 2026 الصاحب — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  );
};

export default Footer;
