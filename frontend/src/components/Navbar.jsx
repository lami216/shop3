import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, ListTree, LogIn, LogOut, Lock, Menu, PackageSearch, ShoppingCart, UserPlus, X } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useCategoryStore } from "../stores/useCategoryStore";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();
  const cartItemCount = cart.reduce((total, item) => total + (item.quantity ?? 0), 0);
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const location = useLocation();
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const categoriesLoading = useCategoryStore((state) => state.loading);
  const categories = useCategoryStore((state) => state.categories);
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name, "ar")), [categories]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsCategoriesOpen(false);
  };

  const navItemClass = (isActive) =>
    `flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-[#111111] transition-colors duration-150 ${
      isActive ? "bg-[#f7f1e4] border-r-2 border-brand-primary" : "hover:bg-[#fafafa]"
    }`;

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
        <Link to='/signup' className='golden-button justify-center text-sm' onClick={closeMenu}>
          <UserPlus size={18} />
          <span className='ml-2'>{t("nav.signup")}</span>
        </Link>
        <Link
          to='/login'
          className='inline-flex items-center justify-center gap-2 rounded-md border border-[#d1d5db] px-6 py-3 text-sm font-semibold text-[#111111] transition-colors duration-150 hover:border-brand-primary hover:text-brand-primary'
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
      <header className='fixed inset-x-0 top-0 z-50 bg-white shadow-sm'>
        <div className='mx-auto flex h-20 max-w-6xl items-center justify-between px-4'>
          <button
            type='button'
            className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111111] transition-colors duration-150 hover:text-brand-primary'
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={t("nav.menu")}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to='/' className='flex flex-col items-center gap-1 text-center' onClick={closeMenu}>
            <span className='text-sm font-semibold text-[#111111]'>Amber OUD</span>
            <span className='text-xs text-[#6b7280]'>Perfumes & Incense</span>
          </Link>

          <Link
            to='/cart'
            className='relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111111] transition-colors duration-150 hover:text-brand-primary'
            aria-label={t("nav.cart")}
            onClick={closeMenu}
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white'>
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-200 ${isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeMenu}
      />

      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-[min(92vw,24rem)] flex-col gap-4 overflow-y-auto border-l border-[#f3f4f6] bg-white p-4 shadow-xl transition-transform duration-200 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-semibold text-[#111111]'>{t("nav.menu")}</h2>
          <button
            type='button'
            onClick={closeMenu}
            aria-label='Close sidebar'
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] text-[#111111] hover:text-brand-primary'
          >
            <X size={18} />
          </button>
        </div>

        <nav className='space-y-2'>
          <Link to='/' onClick={closeMenu} className={navItemClass(location.pathname === "/")}>
            <span className='flex items-center gap-3'>
              <PackageSearch size={18} className='text-[#4b5563]' />
              {t("nav.allProducts")}
            </span>
          </Link>

          {isAdmin && (
            <Link to='/secret-dashboard' onClick={closeMenu} className={navItemClass(location.pathname === "/secret-dashboard")}>
              <span className='flex items-center gap-3'>
                <Lock size={18} className='text-[#4b5563]' />
                {t("nav.dashboard")}
              </span>
            </Link>
          )}

          <Link to='/cart' onClick={closeMenu} className={navItemClass(location.pathname === "/cart")}>
            <span className='flex items-center gap-3'>
              <ShoppingCart size={18} className='text-[#4b5563]' />
              {t("nav.cart")}
            </span>
            {cartItemCount > 0 && <span className='rounded-full bg-brand-primary px-2 py-0.5 text-xs font-bold text-white'>{cartItemCount}</span>}
          </Link>

          <Link to='/track' onClick={closeMenu} className={navItemClass(location.pathname === "/track")}>
            <span className='flex items-center gap-3'>
              <PackageSearch size={18} className='text-[#4b5563]' />
              تتبع الطلب
            </span>
          </Link>
        </nav>

        <section className='rounded-xl bg-[#fafafa] text-sm text-[#111111]'>
          <button
            type='button'
            onClick={() => setIsCategoriesOpen((value) => !value)}
            className='flex w-full items-center justify-between px-4 py-3 font-semibold'
          >
            <span className='flex items-center gap-2'>
              <ListTree size={18} className='text-[#4b5563]' />
              {t("nav.categoriesHeading")}
            </span>
            {isCategoriesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {isCategoriesOpen && (
            <div className='border-t border-[#eeeeee]'>
              {categoriesLoading ? (
                <p className='px-4 py-3 text-sm text-[#6b7280]'>{t("common.loading")}</p>
              ) : sortedCategories.length === 0 ? (
                <p className='px-4 py-3 text-sm text-[#6b7280]'>{t("nav.categoriesEmpty")}</p>
              ) : (
                <ul>
                  {sortedCategories.map((category) => {
                    const isCategoryActive = location.pathname === `/category/${category.slug}`;
                    return (
                      <li key={category._id} className='border-b border-[#eeeeee] px-3 py-3 last:border-b-0'>
                        <Link
                          to={`/category/${category.slug}`}
                          onClick={closeMenu}
                          className={`flex items-center justify-between rounded-md px-2 py-1.5 ${isCategoryActive ? "text-brand-primary" : "text-[#111111]"}`}
                        >
                          <span>{category.name}</span>
                          <ListTree size={16} className={isCategoryActive ? "text-brand-primary" : "text-[#4b5563]"} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        <div className='mt-auto space-y-4 border-t border-[#f3f4f6] pt-6 text-sm text-[#6b7280]'>{renderAuthActions()}</div>
      </aside>
    </>
  );
};

export default Navbar;
