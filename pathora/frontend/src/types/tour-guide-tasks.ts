export enum TourGuideTaskStatus {
  Pending = 'Pending',
  Completed = 'Completed',
}

export interface TourGuideTask {
  id: string;
  tourInstanceId: string;
  assignedGuideId?: string | null;
  assignedGuideName?: string | null;
  title: string;
  description?: string | null;
  isMandatory: boolean;
  status: TourGuideTaskStatus;
  completedAt?: string | null;
  completedBy?: string | null;
  completedByName?: string | null;
  notes?: string | null;
  evidenceImageUrls: string[];
}

export interface CreateTourGuideTaskRequest {
  tourInstanceId: string;
  title: string;
  description?: string | null;
  isMandatory: boolean;
  assignedGuideId?: string | null;
}

export interface UpdateTourGuideTaskRequest {
  title: string;
  description?: string | null;
  isMandatory: boolean;
  assignedGuideId?: string | null;
}

export interface UpdateTourGuideTaskStatusRequest {
  status: TourGuideTaskStatus;
  notes?: string | null;
  evidenceImageUrls?: string[] | null;
}
