export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
};

export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
  description?: string;
  tags?: string[];
  priority?: Priority;
  dueDate?: string;
};
