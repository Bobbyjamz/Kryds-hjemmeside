export function scrollToContract(e?: React.MouseEvent) {
  const el = document.getElementById("contract");
  if (!el) return;
  e?.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("contract-pulse");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("contract-pulse");
  el.addEventListener("animationend", () => el.classList.remove("contract-pulse"), { once: true });
}
