import { BlogPost } from './blog.model';

export interface ReadingList {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  userName: string;
  userDisplayName?: string;
  userProfilePictureUrl?: string;
  itemCount: number;
  followerCount: number;
  isFollowedByCurrentUser: boolean;
}

export interface ReadingListDetail extends ReadingList {
  posts: BlogPost[];
}

export interface CreateReadingList {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface UpdateReadingList {
  name: string;
  description?: string;
  isPublic: boolean;
}
