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
                                "golden-glow": "0 0 25px color-mix(in srgb, var(--primary) 20%, transparent)",
                                "golden-glow-strong": "0 0 45px color-mix(in srgb, var(--primary) 35%, transparent)",
                        },
                        backgroundImage: {
                                "golden-gradient":
                                        "linear-gradient(135deg, var(--primary) 0%, var(--primary) 50%, var(--primary) 100%)",
                        },
                        fontFamily: {
                                sans: ["'Cairo'", "'IBM Plex Arabic'", "system-ui", "sans-serif"],
                        },
                },
        },
        plugins: [],
};
