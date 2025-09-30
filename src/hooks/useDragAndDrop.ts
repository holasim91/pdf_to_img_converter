import { useState } from "react";

export const useDragAndDrop = (onFilesDropped: (files: File[]) => void) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // relatedTarget이 현재 요소의 자식이 아닐 때만 dragging 상태 해제
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );

    console.log("Dropped files:", droppedFiles);

    if (droppedFiles.length > 0) {
      onFilesDropped(droppedFiles);
    }
  };
  return {
    // state
    isDragging,
    // actions
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};
