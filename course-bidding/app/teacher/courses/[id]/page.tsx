"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { connectWallet } from "@/lib/ethereum";
import { CourseMetadataDisplay } from "@/components/course-metadata-display";
import { Course } from "@/lib/contract";

export default function TeacherCoursePage() {
  const params = useParams();
  const courseId = Number(params.id);

  const {
    account,
    isTeacher,
    getCourse,
    finalizeBidding,
    loading,
    error: contractError,
  } = useContract();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizingBidding, setIsFinalizingBidding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      if (!account || !isTeacher) return;

      setIsLoading(true);
      try {
        const courseData = await getCourse(courseId);
        setCourse(courseData);
      } catch (err) {
        console.error(`Error fetching course ${courseId}:`, err);
        setError(`Failed to load course #${courseId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && courseId) {
      fetchCourse();
    }
  }, [courseId, account, isTeacher, loading, getCourse]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleFinalizeBidding = async () => {
    setIsFinalizingBidding(true);
    setError("");

    try {
      await finalizeBidding(courseId);

      // Refresh course data
      const updatedCourse = await getCourse(courseId);
      setCourse(updatedCourse);
    } catch (err) {
      console.error("Error finalizing bidding:", err);
      setError(
        "Failed to finalize bidding. Make sure you are the course teacher."
      );
    } finally {
      setIsFinalizingBidding(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Details</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <div className="py-10 text-center">
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (contractError || (error && !course)) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Details</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{contractError || error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Details</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view course details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet to access course details.
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

  if (!isTeacher) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Details</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have teacher privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Authorized</AlertTitle>
              <AlertDescription>
                Your account does not have the teacher role required to view
                course details.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Not Found</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Course Not Found</AlertTitle>
          <AlertDescription>
            The requested course could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Sort bids by amount (highest first)
  const sortedBids = course.bids
    ? [...course.bids].sort((a, b) => b.bidAmount - a.bidAmount)
    : [];

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course #{course.courseId}</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Course ID: {course.courseId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {course.capacity} students
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Bids</p>
                  <p className="text-sm text-muted-foreground">
                    {sortedBids.length} bids
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={course.biddingActive ? "secondary" : "outline"}
                  >
                    {course.biddingActive ? "Bidding Open" : "Finalized"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Metadata URI</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {course.metadataURI}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Course Information</h3>
                <CourseMetadataDisplay metadataUri={course.metadataURI} />
              </div>
            </CardContent>
            {course.biddingActive && (
              <CardFooter>
                <Button
                  onClick={handleFinalizeBidding}
                  disabled={isFinalizingBidding || sortedBids.length === 0}
                  className="w-full"
                >
                  {isFinalizingBidding ? "Finalizing..." : "Finalize Bidding"}
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Bids</CardTitle>
              <CardDescription>
                {course.biddingActive
                  ? `All bids are sorted by amount. The top ${course.capacity} bids will win when bidding is finalized.`
                  : "Bidding has been finalized for this course."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedBids.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Address</TableHead>
                      <TableHead className="text-right">Bid Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBids.map((bid, index) => (
                      <TableRow key={bid.bidder}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono">
                          {bid.bidder.substring(0, 6)}...
                          {bid.bidder.substring(bid.bidder.length - 4)}
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.bidAmount} ETH
                        </TableCell>
                        <TableCell className="text-right">
                          {index < course.capacity ? (
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-500 hover:bg-green-500/10"
                            >
                              {course.biddingActive ? "Winning" : "Winner"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-500/10 text-red-500 hover:bg-red-500/10"
                            >
                              {course.biddingActive ? "Losing" : "Lost"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No bids have been placed yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
