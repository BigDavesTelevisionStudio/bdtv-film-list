import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Tv2 } from "lucide-react";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#000" }}
    >
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Tv2 className="h-7 w-7 text-amber-400" />
          <span className="text-xl font-semibold tracking-tight text-white">
            BigDave<span className="text-amber-400">TV</span>
          </span>
        </div>
        <p className="text-sm text-[#86868b]">Admin access only</p>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorBackground: "#1c1c1e",
            colorText: "#f5f5f7",
            colorTextSecondary: "#86868b",
            colorInputBackground: "#2c2c2e",
            colorInputText: "#f5f5f7",
            colorPrimary: "#f5a623",
            borderRadius: "12px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          },
          elements: {
            card: "shadow-none border border-white/8",
            headerTitle: "text-white font-semibold",
            headerSubtitle: "text-[#86868b]",
            formButtonPrimary:
              "bg-amber-500 hover:bg-amber-400 text-black font-medium",
            footerActionLink: "text-amber-400 hover:text-amber-300",
          },
        }}
      />

      <Link
        href="/"
        className="mt-8 text-sm text-[#86868b] hover:text-white transition-colors"
      >
        ← Back to BigDaveTV
      </Link>
    </div>
  );
}
