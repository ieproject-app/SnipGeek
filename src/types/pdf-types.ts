
export type Annotation = {
  text: string;
  color: string;
};

export type PageInfo = {
  id: string;
  originalFile: File;
  pageNumber: number;
  annotations: Annotation[];
};
