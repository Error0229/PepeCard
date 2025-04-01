"use client";

import { parseMetadataUri } from "@/lib/pinata";
import { useState, useEffect } from "react";

interface CourseMetadata {
  name: string;
}

export function CourseTitleDisplay({ metadataUri }: { metadataUri: string }) {
  const [courseName, setCourseName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata: CourseMetadata = await parseMetadataUri(metadataUri);
        setCourseName(metadata.name);
      } catch (error) {
        console.error("Error fetching course metadata:", error);
        setCourseName("Untitled Course");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [metadataUri]);

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return <span>{courseName}</span>;
}
