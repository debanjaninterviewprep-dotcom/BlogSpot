export interface SocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
}

export interface UserProfile {
  id: string;
  userName: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  website?: string;
  location?: string;
  socialLinks?: SocialLinks;
  skills: string[];
  joinedAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByCurrentUser: boolean;
}

export interface UpdateProfile {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  socialLinks?: SocialLinks;
  skills?: string[];
}

export interface CreatorAnalytics {
  totalViews: number;
  totalReactions: number;
  totalComments: number;
  totalFollowers: number;
  followersGrowth30d: number;
  topPosts: TopPost[];
  dailyStats: DailyStat[];
}

export interface TopPost {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
}

export interface DailyStat {
  date: string;
  views: number;
  reactions: number;
  comments: number;
}
