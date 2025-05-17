import { useState } from "react";
import { BASE_URL, type FetchStatus } from "../constants";

export const useUploadCsv = () => {
  const [uploadingCsv, setUploadingCsv] = useState<FetchStatus>("idle");

  const postCsv = async (file: File) => {
    try {
      setUploadingCsv("loading");

      const formData = new FormData();
      formData.append("csvFile", file);

      const response = await fetch(`${BASE_URL}/csv/upload/direct`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setUploadingCsv("success");
      return result;
    } catch (error) {
      console.error("Error uploading direct:", error);
      setUploadingCsv("error");
    }
  };

  return { postCsv, uploadingCsv };
};
