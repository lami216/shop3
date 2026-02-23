export const formatMRU = (value) =>
        new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "MRU",
                minimumFractionDigits: 0,
        }).format(value);

export default formatMRU;
