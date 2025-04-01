"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, ExternalLink } from "lucide-react";
import { parseMetadataUri, getIpfsGatewayUrl } from "@/lib/pinata";

interface CourseMetadataDisplayProps {
  metadataUri: string;
}

export function CourseMetadataDisplay({
  metadataUri,
}: CourseMetadataDisplayProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!metadataUri) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await parseMetadataUri(metadataUri);
        setMetadata(data);
      } catch (err) {
        console.error("Error parsing metadata:", err);
        setError("Failed to load course metadata");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [metadataUri]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Metadata</CardTitle>
          <CardDescription>Error loading metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs mt-2 break-all">Raw URI: {metadataUri}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Metadata</CardTitle>
          <CardDescription>No metadata available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs break-all">Raw URI: {metadataUri}</p>
        </CardContent>
      </Card>
    );
  }

  const hasMaterials =
    metadata.materials && metadata.materials.startsWith("ipfs://");
  const materialsCid = hasMaterials
    ? metadata.materials.replace("ipfs://", "")
    : null;
  const materialsUrl = materialsCid ? getIpfsGatewayUrl(materialsCid) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{metadata.name || "Unnamed Course"}</CardTitle>
            <CardDescription>
              Created{" "}
              {metadata.created
                ? new Date(metadata.created).toLocaleDateString()
                : "Unknown date"}
            </CardDescription>
          </div>
          {metadataUri.startsWith("ipfs://") && (
            <Badge variant="outline" className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              IPFS
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metadata.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">
              {metadata.description}
            </p>
          </div>
        )}

        {hasMaterials && (
          <div>
            <h4 className="text-sm font-medium mb-2">Course Materials</h4>
            <div className="flex items-center p-3 border rounded-md bg-muted/20">
              <FileText className="h-5 w-5 text-primary mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Course Materials</p>
                <p className="text-xs text-muted-foreground truncate">
                  {materialsCid}
                </p>
              </div>
              <a
                href={materialsUrl || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2"
              >
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </a>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2">
          <p>Metadata URI: {metadataUri}</p>
        </div>
      </CardContent>
    </Card>
  );
}
