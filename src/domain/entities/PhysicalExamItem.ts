export interface PhysicalExamItem {
  id: string;
  patientId: string;
  domain: string;
  itemKey: string;
  response: string;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}
