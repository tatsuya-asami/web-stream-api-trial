export const downloadCsv = async (
  url: string,
  options: RequestInit = {}
): Promise<string> => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/csv",
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Error downloading CSV:", error);
    throw error;
  }
};
