import "./App.css";
import { useDownloadCsv } from "./api/useDownloadCsv";
import { useStreamDownload } from "./api/useStreamDownload";
import { useUploadCsv } from "./api/useUploadCsv";
import { useStreamUpload } from "./api/useStreamUpload";

function App() {
  const { getCsv: getSmallCsv, downloadingCsv: downloadingSmallCsv } =
    useDownloadCsv("csv/small");
  const { getCsv: getLargeCsv, downloadingCsv: downloadingLargeCsv } =
    useDownloadCsv("csv/large");
  const { getStream, downloadingStream, percent } =
    useStreamDownload("csv/stream");
  const {
    getStream: getStreamFromDb,
    downloadingStream: downloadingStreamFromDb,
    percent: percentFromDb,
  } = useStreamDownload("csv/from/db");

  const { postCsv, uploadingCsv } = useUploadCsv();
  const { postCsvStream, uploadingCsvStream, uploadProgress } =
    useStreamUpload("csv/upload/stream");
  const {
    postCsvStream: insertCsvStream,
    uploadingCsvStream: uploadingInsertCsvStream,
    uploadProgress: uploadInsertCsvProgress,
  } = useStreamUpload("csv/insert/stream");

  return (
    <>
      <div>
        GET SMALL CSV
        <button onClick={getSmallCsv}>download</button>
        {downloadingSmallCsv}
      </div>
      <div>
        GET LARGE CSV
        <button onClick={getLargeCsv}>download</button>
        {downloadingLargeCsv}
      </div>
      <div>
        GET STREAM
        <button onClick={getStream}>download</button>
        {downloadingStream}
        {` ${percent}bytes`}
      </div>
      <div>
        GET STREAM CSV FROM MySQL
        <button onClick={getStreamFromDb}>download</button>
        {downloadingStreamFromDb}
        {` ${percentFromDb}bytes`}
      </div>
      <div>
        POST CSV (Direct)
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              postCsv(file);
            }
          }}
        />
        {uploadingCsv}
      </div>
      <div>
        POST CSV (Stream)
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              postCsvStream(file);
            }
          }}
        />
        {uploadingCsvStream} {uploadProgress}%
      </div>
      <div>
        Insert CSV (Stream) to MySQL
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              insertCsvStream(file);
            }
          }}
        />
        {uploadingInsertCsvStream} {uploadInsertCsvProgress}%
      </div>
    </>
  );
}

export default App;
