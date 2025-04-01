"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import {
  uploadFileToPinata,
  generateCourseMetadata,
  uploadMetadataToPinata,
} from "@/lib/pinata";

interface CourseFormProps {
  onSubmit: (capacity: number, metadataURI: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CourseForm({ onSubmit, isSubmitting }: CourseFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [materialsCid, setMaterialsCid] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setUploadError("");
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setMaterialsCid("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      setIsUploading(true);
      // Validate inputs
      if (!name.trim()) {
        setError("Course name is required");
        return;
      }

      if (!capacity || Number(capacity) <= 0) {
        setError("Capacity must be greater than 0");
        return;
      }

      // Upload file to IPFS if selected
      let fileCid = materialsCid;
      if (selectedFile && !materialsCid) {
        try {
          const response = await uploadFileToPinata(
            selectedFile,
            `${name}-materials`
          );
          fileCid = response.cid;
          setMaterialsCid(fileCid);
        } catch (err) {
          setUploadError("Failed to upload file to IPFS");
          setIsUploading(false);
          return;
        }
      }

      // Generate and upload metadata
      const metadata = generateCourseMetadata(name, description, fileCid);
      const metadataResponse = await uploadMetadataToPinata(
        metadata,
        `course-${name}`
      );

      // Create course with metadata URI
      const metadataUri = `ipfs://${metadataResponse.cid}`;
      const result = await onSubmit(Number(capacity), metadataUri);

      if (result) {
        setSuccess(true);
        // Reset form
        setName("");
        setDescription("");
        setCapacity("");
        setSelectedFile(null);
        setMaterialsCid("");
      }
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err instanceof Error ? err.message : "Failed to create course");
    }
    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Course created successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Course Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Introduction to Blockchain"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Course Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide a brief description of the course"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="e.g., 30"
          min="1"
          required
        />
      </div>

      <FileUpload
        onUpload={handleFileUpload}
        onClear={handleFileClear}
        selectedFile={selectedFile}
        isUploading={isUploading}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.gif,.mp4"
        maxSize={50} // 50MB
        label="Course Materials (optional)"
        error={uploadError}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting ? "Creating Course..." : "Create Course"}
      </Button>
    </form>
  );
}
