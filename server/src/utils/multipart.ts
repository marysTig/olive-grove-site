import Busboy from "busboy";
import type { Express } from "express";

export async function parseMultipartFile(
  buffer: Buffer,
  contentType: string,
  fieldName = "image",
): Promise<Express.Multer.File> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: { "content-type": contentType } });
    let settled = false;
    let sawTargetField = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const succeed = (file: Express.Multer.File) => {
      if (settled) return;
      settled = true;
      resolve(file);
    };

    busboy.on("file", (name, file, info) => {
      if (name !== fieldName) {
        file.resume();
        return;
      }

      sawTargetField = true;
      const chunks: Buffer[] = [];

      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("limit", () => fail(new Error("File exceeds upload size limit")));
      file.on("end", () => {
        const fileBuffer = Buffer.concat(chunks);
        if (!fileBuffer.length) {
          fail(new Error("Uploaded file is empty"));
          return;
        }

        succeed({
          fieldname: name,
          originalname: info.filename,
          encoding: info.encoding,
          mimetype: info.mimeType,
          size: fileBuffer.length,
          buffer: fileBuffer,
          stream: file,
          destination: "",
          filename: info.filename,
          path: "",
        });
      });
    });

    busboy.on("error", (error) => fail(error instanceof Error ? error : new Error(String(error))));
    busboy.on("finish", () => {
      if (!settled && !sawTargetField) {
        fail(new Error(`No "${fieldName}" file provided`));
      }
    });

    busboy.end(buffer);
  });
}
