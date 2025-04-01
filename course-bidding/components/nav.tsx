"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet-connect";
import { cn } from "@/lib/utils";
import { useContract } from "@/hooks/use-contract";

export function Nav() {
  const pathname = usePathname();
  const { account, isTeacher, isRegistered } = useContract();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            開學後網路加退選系統(四機)
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {isTeacher && (
              <Link href="/teacher/courses">
                <Button
                  variant={
                    pathname.startsWith("/teacher") ? "default" : "ghost"
                  }
                >
                  Teacher Dashboard
                </Button>
              </Link>
            )}
            {isRegistered && (
              <>
                <Link href="/dashboard">
                  <Button
                    variant={pathname === "/dashboard" ? "default" : "ghost"}
                  >
                    Student Dashboard
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button
                    variant={
                      pathname.startsWith("/courses") ? "default" : "ghost"
                    }
                  >
                    Browse Courses
                  </Button>
                </Link>
              </>
            )}
            {!isRegistered && !isTeacher && account && (
              <Link href="/register">
                <Button
                  variant={pathname === "/register" ? "default" : "ghost"}
                >
                  Register
                </Button>
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
