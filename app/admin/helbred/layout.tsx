import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import "./helbred.css";

export const metadata = {
  title: "Sarah · Helbred",
};

export default async function HelbredLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="sarah-helbred-root">
      {children}
    </div>
  );
}
