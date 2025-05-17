import { useState } from "react";
import { BASE_URL, type FetchStatus } from "../constants";

export const useStreamUpload = (url: string) => {
  const [uploadingCsvStream, setUploadingCsvStream] =
    useState<FetchStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const postCsvStream = async (file: File) => {
    const [controller, timeoutId] = setupUploadTimeout(file.name);

    try {
      setUploadingCsvStream("loading");
      setUploadProgress(0);

      const totalBytes = file.size;
      console.log(`Starting upload of ${file.name} (${totalBytes} bytes)`);

      const progressStream = createProgressStream(
        totalBytes,
        (progressPercent, processedBytes) => {
          setUploadProgress(progressPercent);
          console.log(
            `Upload progress: ${progressPercent}%, sent ${processedBytes}/${totalBytes} bytes`
          );
        }
      );

      const fileStream = file.stream().pipeThrough(progressStream);
      const result = await uploadFileStream(
        url,
        file,
        fileStream,
        controller.signal
      );

      clearTimeout(timeoutId);
      console.log("Upload complete:", result);
      setUploadingCsvStream("success");
      return result;
    } catch (error) {
      console.error("Error uploading stream:", error);
      setUploadingCsvStream("error");
      setUploadProgress(0);
    }
  };

  return {
    postCsvStream,
    uploadingCsvStream,
    uploadProgress,
  };
};

const timeoutMs = 20 * 60 * 1000;

const setupUploadTimeout = (fileName: string): [AbortController, number] => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(
      `Client-side upload timeout of ${timeoutMs}ms reached for file ${fileName}. Aborting fetch.`
    );
    controller.abort();
  }, timeoutMs);

  return [controller, timeoutId];
};

const createProgressStream = (
  totalBytes: number,
  onProgress: (progressPercent: number, processedBytes: number) => void
): TransformStream => {
  let processedBytes = 0;

  return new TransformStream({
    transform(chunk, controller) {
      processedBytes += chunk.byteLength;
      const progressPercent = Math.round((processedBytes / totalBytes) * 100);
      onProgress(progressPercent, processedBytes);
      controller.enqueue(chunk);
    },
  });
};

const uploadFileStream = async (
  url: string,
  file: File,
  fileStream: ReadableStream,
  signal: AbortSignal
) => {
  const response = await fetch(`${BASE_URL}/${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
    body: fileStream,
    // @ts-expect-error 型が存在しない https://github.com/node-fetch/node-fetch/issues/1769
    duplex: "half",
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
