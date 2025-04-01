import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  開學後網路加退選系統(四機)
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  A blockchain-based platform for fair and transparent course
                  registration
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline" size="lg">
                    View Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <CardTitle>For Students</CardTitle>
                  <CardDescription>Register and bid on courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Register to receive initial credits and participate in the
                    course bidding process. Bid strategically to secure spots in
                    your desired courses.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button className="w-full">Register Now</Button>
                  </Link>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>For Teachers</CardTitle>
                  <CardDescription>Create and manage courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Create courses with custom capacity, manage the bidding
                    process, and finalize course registrations based on student
                    bids.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/teacher/courses" className="w-full">
                    <Button className="w-full">Manage Courses</Button>
                  </Link>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Transparency</CardTitle>
                  <CardDescription>Fair and open bidding</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    All bids are recorded on the blockchain, ensuring a
                    transparent and fair course allocation process based on
                    student preferences.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/courses" className="w-full">
                    <Button variant="outline" className="w-full">
                      View All Courses
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container max-w-screen-xl mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Course Bidding System. All rights
            reserved.
          </p>
          <p className="text-center text-sm text-muted-foreground md:text-right">
            Contract: {CONTRACT_ADDRESS}
          </p>
        </div>
      </footer>
    </div>
  );
}
