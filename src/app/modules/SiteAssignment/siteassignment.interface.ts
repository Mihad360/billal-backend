// Site Assignment Interface
export interface ISiteAssignment {
  _id: string;
  siteId: string;
  workerId: string;
  assignedBy: string;
  assignedAt: Date;
  isActive: boolean;
}
