import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    // 🔹 Custom CSS theme (your variables)
    document.documentElement.setAttribute("data-theme", theme);

    // 🔹 Bootstrap 5.3 theme (THIS FIXES LOGIN DARK ISSUE)
    document.documentElement.setAttribute("data-bs-theme", theme);

    // 🔹 Browser native elements (inputs, scrollbars, autofill)
    document.documentElement.style.colorScheme = theme;

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
