export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  isPublished: boolean;
  isDraft: boolean;
  status?: number; // 0=Draft, 1=Scheduled, 2=Published, 3=Archived
  scheduledPublishAt?: string; // ISO datetime string
  readingTimeMinutes: number;
  category?: string;
  featuredImageUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  authorUserName: string;
  authorDisplayName?: string;
  authorProfilePictureUrl?: string;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  isBookmarkedByCurrentUser: boolean;
  reactionCounts: { [key: string]: number };
  currentUserReaction?: string;
  currentUserReactionCount?: number;
  repostCount: number;
  isRepostedByCurrentUser: boolean;
  currentUserRepostQuote?: string;
  poll?: Poll;
  tags: string[];
  images: PostImage[];
}

export interface PostImage {
  id: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
}

export interface CreateBlogPost {
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags?: string[];
  isDraft?: boolean;
  poll?: CreatePoll;
}

export interface UpdateBlogPost {
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags?: string[];
  isDraft?: boolean;
  poll?: CreatePoll;
}

export interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  userId: string;
  userName: string;
  userDisplayName?: string;
  userProfilePictureUrl?: string;
  parentCommentId?: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  replies: Comment[];
}

export interface CreateComment {
  content: string;
  parentCommentId?: string;
}

// Reactions
export type ReactionType = 'Like' | 'Love' | 'Fire' | 'Clap';

export interface ReactionDto {
  type: ReactionType;
}

export interface ReactionSummaryDto {
  totalCount: number;
  counts: { [key: string]: number };
  currentUserReaction?: string;
  currentUserReactionCount?: number;
}

// Drafts
export interface DraftBlog {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags: string[];
  blogPostId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDraft {
  id?: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags?: string[];
  blogPostId?: string;
}

// Search
export interface SearchResult {
  posts: PagedBlogPosts;
  users: UserSearchResult[];
  tags: string[];
}

// Reposts
export interface Repost {
  id: string;
  quote?: string;
  createdAt: string;
  userId: string;
  userName: string;
  userDisplayName?: string;
  userProfilePictureUrl?: string;
  post: BlogPost;
}

export interface RepostSummary {
  repostCount: number;
  isRepostedByCurrentUser: boolean;
  currentUserQuote?: string;
}

// Polls
export interface Poll {
  id: string;
  question: string;
  expiresAt?: string;
  isExpired: boolean;
  totalVotes: number;
  currentUserVotedOptionId?: string;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  sortOrder: number;
  voteCount: number;
  votePercentage: number;
}

export interface CreatePoll {
  question: string;
  options: string[];
  expiresAt?: string;
}

export interface PagedBlogPosts {
  items: BlogPost[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UserSearchResult {
  id: string;
  userName: string;
  displayName?: string;
  profilePictureUrl?: string;
  followersCount: number;
}
