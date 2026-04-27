"use client";
import { useState, createContext, useContext, useCallback, useRef } from "react";

type ToastType = "success" | "error";
interface ToastMsg { id: number; message: string; type: ToastType; }

const Ctx = createContext<{ show: (msg: string, type?: ToastType) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);
  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-24 right-8 z-[600] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-[2px] text-[13px] font-condensed font-bold tracking-[.06em] uppercase shadow-xl animate-fadeIn ${
              t.type === "success" ? "bg-yellow text-black" : "bg-red-500 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
