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
import { connectWallet, formatCredit } from "@/lib/ethereum";
import { Course } from "@/lib/contract";
import { CourseTitleDisplay } from "@/components/course-title-display";

export default function TeacherCoursesPage() {
  const {
    account,
    isTeacher,
    getActiveCourses,
    getFinalizedCourses,
    createCourse,
    finalizeBidding,
    loading,
    error: contractError,
  } = useContract();

  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [finalizedCourses, setFinalizedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCourse, setNewCourse] = useState({
    name: "",
    capacity: "",
    metadata: "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!account || !isTeacher) return;

      setIsLoading(true);
      try {
        const [active, finalized] = await Promise.all([
          getActiveCourses(),
          getFinalizedCourses(),
        ]);

        setActiveCourses(active);
        setFinalizedCourses(finalized);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchCourses();
    }
  }, [account, isTeacher, loading, getActiveCourses, getFinalizedCourses]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleCreateCourse = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");

    try {
      if (!newCourse.capacity || Number.parseInt(newCourse.capacity) <= 0) {
        throw new Error("Please enter a valid capacity");
      }

      if (!newCourse.metadata) {
        throw new Error("Please enter metadata URI");
      }

      await createCourse(
        Number.parseInt(newCourse.capacity),
        newCourse.metadata
      );

      // Refresh the course list
      const updatedActiveCourses = await getActiveCourses();
      setActiveCourses(updatedActiveCourses);

      // Reset the form
      setNewCourse({
        name: "",
        capacity: "",
        metadata: "",
      });

      // Close the dialog
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinalizeBidding = async (courseId: number) => {
    setIsProcessing(true);
    setError("");

    try {
      await finalizeBidding(courseId);

      // Refresh the course lists
      const [updatedActive, updatedFinalized] = await Promise.all([
        getActiveCourses(),
        getFinalizedCourses(),
      ]);

      setActiveCourses(updatedActive);
      setFinalizedCourses(updatedFinalized);
    } catch (err) {
      console.error("Error finalizing bidding:", err);
      setError(`Failed to finalize bidding for course #${courseId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
        <p className="text-center py-10">Loading...</p>
      </div>
    );
  }

  if (contractError) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
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
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to access the teacher dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet to access the teacher
                dashboard.
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
        <Card>
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
                Your account does not have the teacher role required to access
                this dashboard.
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

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <div className="flex gap-4">
          <Link href="/teacher/courses/create">
            <Button>Create New Course</Button>
          </Link>

          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>

      {error && !isDialogOpen && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active-courses">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-courses">Active Courses</TabsTrigger>
          <TabsTrigger value="finalized-courses">Finalized Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="active-courses" className="mt-6">
          {activeCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeCourses.map((course) => (
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
                      {/* <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Bid:
                        </span>
                        <span>{formatCredit(course.bidAmount)} Credits</span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        <Badge variant="secondary">Bidding Open</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/teacher/courses/${course.courseId}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                    <Button
                      onClick={() => handleFinalizeBidding(course.courseId)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Finalize Bidding"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No active courses found.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="finalized-courses" className="mt-6">
          {finalizedCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {finalizedCourses.map((course) => (
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
                          Winners:
                        </span>
                        <span>
                          {course.winners ? course.winners.length : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        <Badge variant="outline">Finalized</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/teacher/courses/${course.courseId}/results`}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        View Results
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
                  No finalized courses found.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
