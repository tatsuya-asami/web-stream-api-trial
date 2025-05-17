import { useState } from "react";
import { BASE_URL, type FetchStatus } from "../constants";

export const useDownloadCsv = (path: string) => {
  const [downloadingCsv, setDownloadingCsv] = useState<FetchStatus>("idle");

  const getCsv = async () => {
    try {
      setDownloadingCsv("loading");

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

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "downloaded_data.csv");

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadingCsv("success");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      setDownloadingCsv("error");
    }
  };

  return { getCsv, downloadingCsv };
};
