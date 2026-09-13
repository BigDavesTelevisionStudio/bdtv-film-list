import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "Admin — BigDaveTV",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const bigDaveId = process.env.BIGDAVE_USER_ID;
  if (bigDaveId && userId !== bigDaveId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000" }}>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
