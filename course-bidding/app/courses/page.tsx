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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { Course } from "@/lib/contract";
import { CourseTitleDisplay } from "@/components/course-title-display";
import { formatCredit } from "@/lib/ethereum";

export default function CoursesPage() {
  const {
    getActiveCourses,
    getFinalizedCourses,
    loading,
    error: contractError,
  } = useContract();

  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [finalizedCourses, setFinalizedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
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
  }, [loading, getActiveCourses, getFinalizedCourses]);

  if (loading || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Course Catalog</h1>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        <p className="text-center py-10">Loading courses...</p>
      </div>
    );
  }

  if (contractError || error) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Course Catalog</h1>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{contractError || error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Course Catalog</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Bidding</TabsTrigger>
          <TabsTrigger value="finalized">Finalized Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
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
                        <span>{course.bids ? course.bids.length : 0} ETH</span>
                      </div>
                      {/* <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Bid Amount:
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
                  <CardFooter>
                    <Link
                      href={`/courses/${course.courseId}`}
                      className="w-full"
                    >
                      <Button className="w-full">View & Bid</Button>
                    </Link>
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

        <TabsContent value="finalized" className="mt-6">
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
                      href={`/courses/${course.courseId}/results`}
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
