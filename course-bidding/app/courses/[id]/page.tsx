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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { connectWallet } from "@/lib/ethereum";
import { CourseMetadataDisplay } from "@/components/course-metadata-display";
import { Course } from "@/lib/contract";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CoursePage() {
  const params = useParams();
  const courseId = Number(params.id);

  const {
    account,
    isRegistered,
    credits,
    getCourse,
    placeBid,
    loading,
    error: contractError,
  } = useContract();

  const [course, setCourse] = useState<Course | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
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
  }, [courseId, loading, getCourse]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleBid = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!bidAmount || Number.parseFloat(bidAmount) <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    if (Number.parseFloat(bidAmount) > credits) {
      setError(`You don't have enough ETH. Available: ${credits} ETH`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await placeBid(courseId, Number.parseFloat(bidAmount));
      setSuccess(true);
    } catch (err) {
      console.error("Bid error:", err);
      setError("Failed to place bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Details</h1>
          <Link href="/courses">
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
          <Link href="/courses">
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

  if (!course) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Not Found</h1>
          <Link href="/courses">
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

  const sortedBids = course.bids
    ? [...course.bids].sort((a, b) => b.bidAmount - a.bidAmount)
    : [];

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course #{course.courseId}</h1>
          <Link href="/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <CourseMetadataDisplay metadataUri={course.metadataURI} />
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>Course ID: {course.courseId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This course is available for bidding. The top{" "}
                  {course.capacity} bidders will be enrolled when the bidding is
                  finalized.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Instructor</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {course.teacher.substring(0, 6)}...
                        {course.teacher.substring(course.teacher.length - 4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Capacity</p>
                      <p className="text-sm text-muted-foreground">
                        {course.capacity} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Bids</p>
                      <p className="text-sm text-muted-foreground">
                        {course.bids ? course.bids.length : 0} bids
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={course.biddingActive ? "secondary" : "outline"}
                    >
                      {course.biddingActive ? "Bidding Open" : "Bidding Closed"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Place Your Bid</CardTitle>
                <CardDescription>
                  Use your credits to bid on this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!account ? (
                  <Alert className="mb-4">
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Wallet Required</AlertTitle>
                    <AlertDescription>
                      You need to connect your Ethereum wallet to place a bid.
                    </AlertDescription>
                  </Alert>
                ) : !isRegistered ? (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Required</AlertTitle>
                    <AlertDescription>
                      You need to register as a student to place bids.
                    </AlertDescription>
                  </Alert>
                ) : !course.biddingActive ? (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Bidding Closed</AlertTitle>
                    <AlertDescription>
                      Bidding for this course has been finalized.
                    </AlertDescription>
                  </Alert>
                ) : success ? (
                  <Alert className="mb-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Bid Placed Successfully</AlertTitle>
                    <AlertDescription>
                      Your bid of {bidAmount} ETH has been placed.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleBid} className="space-y-4">
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <label
                        htmlFor="bidAmount"
                        className="text-sm font-medium"
                      >
                        Bid Amount (ETH)
                      </label>
                      <Input
                        id="bidAmount"
                        type="number"
                        placeholder="Enter bid amount in ETH"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min="0.000000000000000001"
                        max={credits.toString()}
                        step="0.000000000000000001"
                      />
                      <p className="text-xs text-muted-foreground">
                        Available ETH: {credits}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Higher bids have a better chance of securing a spot in
                      this course. The top {course.capacity} bids will be
                      accepted when bidding closes.
                    </p>
                  </form>
                )}
              </CardContent>
              <CardFooter>
                {!account ? (
                  <Button className="w-full" onClick={handleConnect}>
                    Connect Wallet
                  </Button>
                ) : !isRegistered ? (
                  <Link href="/register" className="w-full">
                    <Button className="w-full">Register Now</Button>
                  </Link>
                ) : success ? (
                  <Link href="/dashboard" className="w-full">
                    <Button className="w-full">Return to Dashboard</Button>
                  </Link>
                ) : !course.biddingActive ? (
                  <Link
                    href={`/courses/${course.courseId}/results`}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      View Results
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleBid}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Place Bid"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Bid Rankings</CardTitle>
              <CardDescription>All bids sorted by bid amount</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedBids.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Bidder</TableHead>
                      <TableHead className="text-right">Bid Amount</TableHead>
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
