const DEFAULT_STORE_WHATSAPP_NUMBER = "22231117700";

const getStoreWhatsAppNumber = () => {
        const envNumber = import.meta.env.VITE_STORE_WHATSAPP_NUMBER;
        if (typeof envNumber === "string" && envNumber.trim()) {
                const digitsOnly = envNumber.replace(/\D/g, "");
                if (digitsOnly) {
                        return digitsOnly;
                }
        }
        return DEFAULT_STORE_WHATSAPP_NUMBER;
};

export const buildOfferWhatsAppMessage = ({ title, priceFormatted }) => {
        const parts = [];
        if (title) {
                parts.push(`مرحباً، أود الاستفسار عن عرض "${title}".`);
        } else {
                parts.push("مرحباً، أود الاستفسار عن أحد العروض المتاحة.");
        }
        if (priceFormatted) {
                parts.push(`سعر العرض هو ${priceFormatted}.`);
        }
        parts.push("أرجو تزويدي بمزيد من التفاصيل، شكراً.");
        return parts.join("\n");
};

export const createOfferWhatsAppUrl = ({ title, priceFormatted }) => {
        const number = getStoreWhatsAppNumber();
        const message = buildOfferWhatsAppMessage({ title, priceFormatted });
        const url = new URL(`https://wa.me/${number}`);
        url.searchParams.set("text", message);
        return url.toString();
};

export default createOfferWhatsAppUrl;
