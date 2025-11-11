import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, Lock, Menu, ShoppingCart, UserPlus, X } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
        const { user, logout } = useUserStore();
        const isAdmin = user?.role === "admin";
        const { cart } = useCartStore();
        const cartItemCount = cart.reduce((total, item) => total + (item.quantity ?? 0), 0);
        const { t } = useTranslation();
        const [isMenuOpen, setIsMenuOpen] = useState(false);

        useEffect(() => {
                if (isMenuOpen) {
                        document.body.style.overflow = "hidden";
                } else {
                        document.body.style.overflow = "";
                }

                return () => {
                        document.body.style.overflow = "";
                };
        }, [isMenuOpen]);

        const closeMenu = () => setIsMenuOpen(false);

        const cartLink = (
                <Link
                        to={'/cart'}
                        className='relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-primary/40 bg-white/80 text-brand-bg transition duration-150 ease-out hover:border-brand-primary hover:shadow-golden'
                        aria-label={t("nav.cart")}
                        onClick={closeMenu}
                >
                        <ShoppingCart size={20} />
                        {cartItemCount > 0 && (
                                <span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-brand-bg shadow-golden'>
                                        {cartItemCount}
                                </span>
                        )}
                </Link>
        );

        const renderAuthActions = () => {
                if (user) {
                        return (
                                <button
                                        onClick={() => {
                                                closeMenu();
                                                logout();
                                        }}
                                        className='golden-button w-full justify-center text-sm sm:w-auto'
                                >
                                        <LogOut size={18} />
                                        <span className='ml-2'>{t("nav.logout")}</span>
                                </button>
                        );
                }

                return (
                        <div className='flex flex-col gap-3 sm:flex-row'>
                                <Link to={'/signup'} className='golden-button justify-center text-sm' onClick={closeMenu}>
                                        <UserPlus size={18} />
                                        <span className='ml-2'>{t("nav.signup")}</span>
                                </Link>
                                <Link
                                        to={'/login'}
                                        className='inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/60 px-6 py-3 text-sm font-semibold text-brand-primary transition duration-150 ease-out hover:border-brand-primary hover:bg-brand-primary/10'
                                        onClick={closeMenu}
                                >
                                        <LogIn size={18} />
                                        <span>{t("nav.login")}</span>
                                </Link>
                        </div>
                );
        };

        return (
                <>
                        <header className='fixed inset-x-0 top-0 z-50 bg-white/95 shadow-golden backdrop-blur-sm'>
                                <div className='mx-auto flex h-24 max-w-6xl items-center justify-between px-4 sm:h-28'>
                                        <button
                                                type='button'
                                                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-primary/30 bg-white text-brand-bg transition duration-150 ease-out hover:border-brand-primary hover:shadow-golden'
                                                onClick={() => setIsMenuOpen((value) => !value)}
                                                aria-label={t("nav.menu")}
                                        >
                                                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                                        </button>

                                        <Link to='/' className='flex flex-col items-center gap-1 text-center' onClick={closeMenu}>
                                                <span className='text-[clamp(1.5rem,4vw,2.5rem)] font-semibold uppercase tracking-[0.45em] text-brand-primary drop-shadow-sm'>
                                                        الصاحب
                                                </span>
                                                <span className='text-[clamp(0.65rem,2vw,0.85rem)] uppercase tracking-[0.35em] text-brand-muted'>
                                                        maison de parfum
                                                </span>
                                        </Link>

                                        <div className='flex items-center gap-3'>
                                                {cartLink}
                                        </div>
                                </div>
                        </header>

                        <div
                                className={`fixed inset-0 z-40 transition-opacity duration-200 ${
                                        isMenuOpen ? "pointer-events-auto bg-black/70 opacity-100" : "pointer-events-none opacity-0"
                                }`}
                                onClick={closeMenu}
                        />

                        <aside
                                className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col gap-8 overflow-y-auto border-l border-brand-primary/20 bg-brand-bg/95 px-6 py-24 text-brand-text shadow-golden backdrop-blur-md transition-transform duration-300 ease-out ${
                                        isMenuOpen ? "translate-x-0" : "translate-x-full"
                                }`}
                        >
                                <nav className='space-y-4 text-lg font-semibold'>
                                        <Link
                                                to={'/'}
                                                onClick={closeMenu}
                                                className='flex items-center justify-between rounded-lg border border-transparent px-4 py-3 transition duration-150 ease-out hover:border-brand-primary/40 hover:bg-white/5'
                                        >
                                                <span>{t("nav.home")}</span>
                                        </Link>
                                        {isAdmin && (
                                                <Link
                                                        to={'/secret-dashboard'}
                                                        onClick={closeMenu}
                                                        className='flex items-center justify-between rounded-lg border border-transparent px-4 py-3 transition duration-150 ease-out hover:border-brand-primary/40 hover:bg-white/5'
                                                >
                                                        <span className='flex items-center gap-3'>
                                                                <Lock size={18} />
                                                                {t("nav.dashboard")}
                                                        </span>
                                                        <span className='text-xs uppercase tracking-[0.25em] text-brand-muted'>VIP</span>
                                                </Link>
                                        )}
                                        <Link
                                                to={'/cart'}
                                                onClick={closeMenu}
                                                className='flex items-center justify-between rounded-lg border border-transparent px-4 py-3 transition duration-150 ease-out hover:border-brand-primary/40 hover:bg-white/5'
                                        >
                                                <span className='flex items-center gap-3'>
                                                        <ShoppingCart size={18} />
                                                        {t("nav.cart")}
                                                </span>
                                                {cartItemCount > 0 && (
                                                        <span className='rounded-full bg-brand-primary px-2 py-0.5 text-xs font-bold text-brand-bg'>
                                                                {cartItemCount}
                                                        </span>
                                                )}
                                        </Link>
                                </nav>

                                <div className='mt-auto space-y-4 border-t border-white/10 pt-6 text-sm text-brand-muted'>
                                        {renderAuthActions()}
                                        <p className='text-center text-xs uppercase tracking-[0.35em] text-brand-muted/80'>
                                                crafted with passion for perfume lovers
                                        </p>
                                </div>
                        </aside>
                </>
        );
};
export default Navbar;
