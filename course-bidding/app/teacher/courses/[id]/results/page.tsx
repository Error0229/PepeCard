"use client";

import { CardFooter } from "@/components/ui/card";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { CheckCircle, XCircle, AlertCircle, Wallet } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { connectWallet } from "@/lib/ethereum";
import { Course } from "@/lib/contract";
import { CourseMetadataDisplay } from "@/components/course-metadata-display";

export default function CourseResultsPage() {
  const params = useParams();
  const courseId = Number(params.id);

  const {
    account,
    isTeacher,
    getCourse,
    loading,
    error: contractError,
  } = useContract();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      if (!account || !isTeacher) return;

      setIsLoading(true);
      try {
        const courseData = await getCourse(courseId);

        // Check if course is finalized
        if (!courseData.finalized) {
          setError("This course has not been finalized yet");
        }

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

  if (loading || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Results</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <div className="py-10 text-center">
          <p>Loading course results...</p>
        </div>
      </div>
    );
  }

  if (contractError || (error && !course)) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Results</h1>
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
          <h1 className="text-3xl font-bold">Course Results</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view course results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet to access course results.
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
          <h1 className="text-3xl font-bold">Course Results</h1>
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
                course results.
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

  if (!course.finalized) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Results</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Finalized</AlertTitle>
          <AlertDescription>
            This course has not been finalized yet. Please finalize the bidding
            to view results.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href={`/teacher/courses/${courseId}`}>
            <Button>Go to Course Details</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sort bids by amount (highest first)
  const sortedBids = course.bids
    ? [...course.bids].sort((a, b) => b.bidAmount - a.bidAmount)
    : [];

  // Split into winners and losers
  const winners = sortedBids.slice(0, course.capacity);
  const losers = sortedBids.slice(course.capacity);

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            Course #{course.courseId} - Results
          </h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <CourseMetadataDisplay metadataUri={course.metadataURI} />
          <Card>
            <CardHeader>
              <CardTitle>Course Results</CardTitle>
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
                  <p className="text-sm font-medium">Total Bids</p>
                  <p className="text-sm text-muted-foreground">
                    {sortedBids.length} bids
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Winners</p>
                  <p className="text-sm text-muted-foreground">
                    {winners.length} students
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="outline">Finalized</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Winning Bids</CardTitle>
              <CardDescription>
                These students have been allocated a spot in the course.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {winners.length > 0 ? (
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
                    {winners.map((bid, index) => (
                      <TableRow key={bid.bidder}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono">
                          {bid.bidder.substring(0, 6)}...
                          {bid.bidder.substring(bid.bidder.length - 4)}
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.bidAmount}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Winner</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No winning bids found.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Losing Bids</CardTitle>
              <CardDescription>
                These students did not secure a spot in the course. Their
                credits have been refunded.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {losers.length > 0 ? (
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
                    {losers.map((bid, index) => (
                      <TableRow key={bid.bidder}>
                        <TableCell>{winners.length + index + 1}</TableCell>
                        <TableCell className="font-mono">
                          {bid.bidder.substring(0, 6)}...
                          {bid.bidder.substring(bid.bidder.length - 4)}
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.bidAmount}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>Refunded</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No losing bids found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
