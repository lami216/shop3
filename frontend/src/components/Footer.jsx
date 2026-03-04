import { Facebook, MessageCircle, Music, PhoneCall } from "lucide-react";

const socialItems = [
        { label: "TikTok", href: "https://www.tiktok.com/", icon: Music },
        { label: "Facebook", href: "https://www.facebook.com/", icon: Facebook },
        { label: "WhatsApp", href: "https://wa.me/", icon: MessageCircle },
        { label: "Phone Call", href: "tel:+0000000000", icon: PhoneCall },
];

const paymentMethods = ["pay1", "pay2", "pay3", "pay4"];

const Footer = () => {
        return (
                <footer className='mt-24 border-t border-white/10 bg-black/80 text-brand-text'>
                        <div className='mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6' dir='rtl'>
                                <div className='grid gap-8 md:grid-cols-3'>
                                        <section className='space-y-2'>
                                                <h3 className='text-gradient-gold text-2xl font-semibold'>الصاحب</h3>
                                                <p className='text-sm text-brand-muted'>رحلة حسية في عالم العطور الفاخرة</p>
                                        </section>

                                        <section className='space-y-3'>
                                                <h4 className='text-lg font-semibold'>روابط مهمة</h4>
                                                <div className='flex flex-col gap-2 text-sm text-brand-muted'>
                                                        <a href='/#about-us' className='transition hover:text-brand-text'>
                                                                من نحن
                                                        </a>
                                                        <a href='/#privacy-policy' className='transition hover:text-brand-text'>
                                                                سياسة الخصوصية
                                                        </a>
                                                </div>
                                        </section>

                                        <section className='space-y-3'>
                                                <h4 className='text-lg font-semibold'>تواصل معنا</h4>
                                                <a
                                                        href='https://wa.me/'
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/40 bg-black/60 px-4 py-2 text-sm font-medium transition hover:border-brand-primary hover:text-brand-primary'
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
                                                {socialItems.map(({ label, href, icon: Icon }) => (
                                                        <a
                                                                key={label}
                                                                href={href}
                                                                className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-brand-muted transition hover:border-brand-primary hover:text-brand-primary'
                                                                aria-label={label}
                                                                target={href.startsWith("http") ? "_blank" : undefined}
                                                                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                                                        >
                                                                <Icon size={18} />
                                                        </a>
                                                ))}
                                        </div>
                                </section>

                                <section>
                                        <div className='flex flex-wrap items-center gap-3'>
                                                {paymentMethods.map((method) => (
                                                        <span
                                                                key={method}
                                                                className='inline-flex h-10 min-w-20 items-center justify-center rounded-md border border-white/20 px-3 text-xs text-brand-muted'
                                                        >
                                                                {method}
                                                        </span>
                                                ))}
                                        </div>
                                </section>

                                <p className='text-center text-sm text-brand-muted'>© 2026 الصاحب — جميع الحقوق محفوظة</p>
                        </div>
                </footer>
        );
};

export default Footer;
