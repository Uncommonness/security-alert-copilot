export type ConversationSummary = {
  id: string;
  title: string;
  createdTimeMs: number;
  updatedTimeMs: number;
};

export type EditModalState = {
  open: boolean;
  id?: string;
  title: string;
};

export type DeleteModalState = {
  open: boolean;
  id?: string;
  title: string;
};
