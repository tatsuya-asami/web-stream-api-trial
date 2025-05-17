import { useState } from "react";
import { BASE_URL, type FetchStatus } from "../constants";

export const useStreamDownload = (path: string) => {
  const [downloadingStream, setDownloadingStream] =
    useState<FetchStatus>("idle");
  const [percent, setPercent] = useState(0);

  const getStream = async () => {
    console.time("useStreamDownload");
    try {
      setDownloadingStream("loading");
      setPercent(0);

      const response = await fetchStreamData(path);

      const progressStream = createProgressStream((progress) => {
        setPercent(progress);
      });

      const downloadStream = response.body?.pipeThrough(progressStream);
      if (!downloadStream) {
        throw new Error("Failed to create download stream");
      }

      const blob = await streamToBlob(downloadStream);

      downloadBlob(blob, "downloaded_data.csv");

      setDownloadingStream("success");
    } catch (error) {
      console.error("Error downloading stream:", error);
      setDownloadingStream("error");
      setPercent(0);
    }
    console.timeEnd("useStreamDownload");
  };

  return { getStream, downloadingStream, percent };
};

const fetchStreamData = async (path: string): Promise<Response> => {
  const response = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      method: "GET",
      Accept: "text/plain",
      "Content-Type": "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response;
};

const createProgressStream = (
  onProgress: (receivedLength: number) => void
): TransformStream => {
  let receivedLength = 0;

  return new TransformStream({
    async transform(chunk, controller) {
      receivedLength += chunk.length;

      onProgress(receivedLength);

      controller.enqueue(chunk);
    },
  });
};

const streamToBlob = async (stream: ReadableStream): Promise<Blob> => {
  return new Response(stream).blob();
};

const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};
