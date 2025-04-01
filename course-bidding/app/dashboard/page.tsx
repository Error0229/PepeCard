"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { connectWallet } from "@/lib/ethereum";
import { Course } from "@/lib/contract";
import { CourseTitleDisplay } from "@/components/course-title-display";

export default function DashboardPage() {
  const {
    account,
    isRegistered,
    credits,
    loading,
    error: contractError,
    getUserBids,
    getUserWinningCourses,
    getActiveCourses,
  } = useContract();

  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [myBids, setMyBids] = useState<
    {
      courseId: number;
      courseName: string;
      bidAmount: number;
      biddingActive: any;
      finalized: any;
    }[]
  >([]);
  const [myWinningCourses, setMyWinningCourses] = useState<
    { id: number; name: string; teacher: any }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!account || !isRegistered) return;

      setIsLoading(true);
      try {
        // Fetch data in parallel
        const [activeCourseData, bidsData, winningCoursesData] =
          await Promise.all([
            getActiveCourses(),
            getUserBids(),
            getUserWinningCourses(),
          ]);

        setActiveCourses(activeCourseData);
        setMyBids(bidsData);
        setMyWinningCourses(winningCoursesData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [
    account,
    isRegistered,
    loading,
    getActiveCourses,
    getUserBids,
    getUserWinningCourses,
  ]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </div>
        <p className="text-center py-10">Loading...</p>
      </div>
    );
  }

  if (contractError) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{contractError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet to access the dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={handleConnect} className="w-full">
              Connect Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Registration Required</CardTitle>
            <CardDescription>
              You need to register before accessing the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Registered</AlertTitle>
              <AlertDescription>
                You need to register as a student to access the dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/register" className="w-full">
              <Button className="w-full">Register Now</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="bg-muted p-2 rounded-md">
            <span className="font-semibold">Available ETH:</span> {credits}
          </div>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active-courses">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-courses">Active Courses</TabsTrigger>
          <TabsTrigger value="my-bids">My Bids</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="active-courses" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeCourses.length > 0 ? (
              activeCourses.map((course) => (
                <Card key={course.courseId}>
                  <CardHeader>
                    <CardTitle>
                      <CourseTitleDisplay metadataUri={course.metadataURI} />
                    </CardTitle>
                    <CardDescription>
                      Teacher: {course.teacher.substring(0, 6)}...
                      {course.teacher.substring(course.teacher.length - 4)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Capacity:
                        </span>
                        <span>{course.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Current Bids:
                        </span>
                        <span>{course.bids ? course.bids.length : 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Competition:
                        </span>
                        <Badge
                          variant={
                            course.bids && course.bids.length > course.capacity
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {course.bids && course.bids.length > course.capacity
                            ? "High"
                            : "Low"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/courses/${course.courseId}`}
                      className="w-full"
                    >
                      <Button className="w-full">Place Bid</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">
                  No active courses found.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-bids" className="mt-6">
          {myBids.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myBids.map((bid) => (
                <Card key={bid.courseId}>
                  <CardHeader>
                    <CardTitle>{bid.courseName}</CardTitle>
                    <CardDescription>Course ID: {bid.courseId}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Your Bid:
                        </span>
                        <span className="font-semibold">
                          {bid.bidAmount} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        <Badge
                          variant={bid.finalized ? "outline" : "secondary"}
                        >
                          {bid.finalized ? "Finalized" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/courses/${bid.courseId}`}>
                      <Button variant="outline" size="sm">
                        View Course
                      </Button>
                    </Link>
                    {!bid.finalized && (
                      <Link href={`/courses/${bid.courseId}`}>
                        <Button size="sm">Increase Bid</Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven't placed any bids yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-courses" className="mt-6">
          {myWinningCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myWinningCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle>{course.name}</CardTitle>
                    <CardDescription>
                      Teacher: {course.teacher.substring(0, 6)}...
                      {course.teacher.substring(course.teacher.length - 4)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-500">Enrolled</Badge>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/courses/${course.id}/details`}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven't won any course bids yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
