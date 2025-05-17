export const downloadFileWithStream = async (
  url: string,
  filename: string
): Promise<void> => {
  try {
    const response: Response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    let effectiveFilename: string = filename;
    const disposition: string | null = response.headers.get(
      "content-disposition"
    );
    if (disposition && disposition.includes("attachment")) {
      const filenameRegex: RegExp = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches: RegExpExecArray | null = filenameRegex.exec(disposition);
      if (matches && matches[1]) {
        effectiveFilename = matches[1].replace(/['"]/g, "");
      }
    }

    const contentLength: string | null = response.headers.get("content-length");
    const totalBytes: number | null = contentLength
      ? parseInt(contentLength, 10)
      : null;
    let receivedBytes: number = 0;

    if (!response.body) {
      throw new Error("Response body is null.");
    }
    const reader: ReadableStreamDefaultReader<Uint8Array> =
      response.body.getReader();

    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value }: ReadableStreamReadResult<Uint8Array> =
        await reader.read();

      if (done) {
        break;
      }

      if (value) {
        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes) {
          const percent: number = Math.round(
            (receivedBytes / totalBytes) * 100
          );
          console.log(`Downloading: ${percent}%`);
        } else {
          console.log(`Received bytes: ${receivedBytes}`);
        }
      }
    }

    const blob: Blob = new Blob(chunks);
    const downloadUrl: string = window.URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = downloadUrl;
    a.download = effectiveFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    console.log("File download complete.");
  } catch (error) {
    console.error("Error during download:", error);
    // エラーを再スローするか、適切に処理する
    // throw error;
  }
};
