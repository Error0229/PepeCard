"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { connectWallet } from "@/lib/ethereum";
import { CourseForm } from "@/components/course-form";

export default function CreateCoursePage() {
  const {
    account,
    isTeacher,
    createCourse,
    loading,
    error: contractError,
  } = useContract();
  const [error, setError] = useState("");

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleCreateCourse = async (capacity: number, metadataURI: string) => {
    try {
      return await createCourse(capacity, metadataURI);
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err instanceof Error ? err.message : "Failed to create course");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
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
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
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
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to create a course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet to create a course.
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnect} className="w-full mt-4">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <Link href="/teacher/courses">
            <Button variant="outline">Back to Courses</Button>
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
                Your account does not have the teacher role required to create
                courses.
              </AlertDescription>
            </Alert>
            <Link href="/" className="block w-full mt-4">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <Link href="/teacher/courses">
          <Button variant="outline">Back to Courses</Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>
              Fill in the details to create a new course for students to bid on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseForm onSubmit={handleCreateCourse} isSubmitting={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
