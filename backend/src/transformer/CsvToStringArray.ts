import { TransformStream } from 'node:stream/web';
import { parse } from 'csv';

export class CsvToStringArray extends TransformStream<string, string[]> {
  constructor() {
    const parserInstance = parse({
      delimiter: ',',
      skip_empty_lines: true,
      from_line: 2,
    });

    super({
      start: (controller) => {
        parserInstance.on('data', (data: string[]) => {
          controller.enqueue(data);
        });

        parserInstance.on('error', (err: Error) => {
          console.error('CSV parsing error in CsvRecordOutput:', err);
          controller.error(err);
        });
      },
      transform: (chunk: string) => {
        parserInstance.write(chunk);
      },
      flush: (controller) => {
        parserInstance.end(() => {
          console.log('CsvRecordOutput: Parser finished, closing controller.');
          controller.terminate();
        });
      },
    });
  }
}
