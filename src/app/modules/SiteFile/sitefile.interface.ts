// Site File Interface (Task Files - PDF/Images uploaded by admin)
export interface ISiteFile {
  _id: string;
  siteId: string;
  fileName: string;
  fileType: "pdf" | "image" | "document" | "other";
  fileUrl: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: Date;
}
