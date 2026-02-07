// Comment Interface
export interface IComment {
  _id: string;
  siteId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}
