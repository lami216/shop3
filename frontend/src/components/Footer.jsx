import SocialLinks from "./SocialLinks";

const Footer = () => {
        const buildTime = new Date(import.meta.env.VITE_BUILD_TIME).toLocaleString();
        return (
                <footer className='mt-24 border-t border-white/10 bg-black/80 text-brand-text'>
                        <div className='mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6'>
                                <div className='space-y-2'>
                                        <span className='text-gradient-gold text-[clamp(1.25rem,3vw,1.75rem)] font-semibold uppercase tracking-[0.45em]'>
                                                الصاحب
                                        </span>
                                        <p className='text-sm text-brand-muted'>
                                                رحلة حسية في عالم العطور الفاخرة
                                        </p>
                                </div>
                                <SocialLinks />
                                <small className='text-xs uppercase tracking-[0.45em] text-brand-muted'>آخر تحديث للموقع: {buildTime}</small>
                        </div>
                </footer>
        );
};

export default Footer;
