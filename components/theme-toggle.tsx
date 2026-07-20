"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="
        fixed
        top-4
        right-4
        z-[9999]
        h-12
        w-12
        rounded-full
        border
        border-zinc-300
        dark:border-zinc-700
        bg-white
        dark:bg-zinc-900
        shadow-lg
        flex
        items-center
        justify-center
      "
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-zinc-700" />
      )}
    </button>
  );
}