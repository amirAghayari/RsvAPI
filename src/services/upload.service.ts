export class UploadService {
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const safeFileName = `${Date.now()}_${fileName.replace(
      /[^a-zA-Z0-9.]/g,
      "_"
    )}`;

    // this is a mock implementation
    return `https://storage.ticket.com/national-card/${safeFileName}`;
  }
}
