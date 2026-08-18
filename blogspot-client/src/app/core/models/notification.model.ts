export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
  actorUserName?: string;
  actorDisplayName?: string;
  actorProfilePictureUrl?: string;
}

export type NotificationType = 'Follow' | 'Reaction' | 'Comment' | 'PostPublished';
