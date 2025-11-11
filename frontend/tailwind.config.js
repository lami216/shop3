/** @type {import('tailwindcss').Config} */
export default {
        content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
        theme: {
                extend: {
                        colors: {
                                brand: {
                                        bg: "var(--bg)",
                                        primary: "var(--primary)",
                                        accent: "var(--accent)",
                                        muted: "var(--muted)",
                                        text: "var(--text)",
                                },
                                "payzone-navy": "var(--bg)",
                                "payzone-white": "var(--text)",
                                "payzone-gold": "var(--primary)",
                                "payzone-indigo": "var(--accent)",
                                surface: {
                                        DEFAULT: "rgba(255, 255, 255, 0.04)",
                                        elevated: "rgba(255, 255, 255, 0.08)",
                                },
                        },
                        boxShadow: {
                                "golden-glow": "0 0 25px rgba(201, 169, 110, 0.2)",
                                "golden-glow-strong": "0 0 45px rgba(201, 169, 110, 0.35)",
                        },
                        backgroundImage: {
                                "golden-gradient":
                                        "linear-gradient(135deg, rgba(201,169,110,0.95) 0%, rgba(246,224,173,0.75) 50%, rgba(201,169,110,0.95) 100%)",
                        },
                        fontFamily: {
                                sans: ["'Cairo'", "'IBM Plex Arabic'", "system-ui", "sans-serif"],
                        },
                },
        },
        plugins: [],
};
