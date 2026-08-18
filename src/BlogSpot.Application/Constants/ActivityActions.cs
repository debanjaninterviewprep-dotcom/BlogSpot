namespace BlogSpot.Application.Constants;

/// <summary>Named actions recorded in the ActivityLogs table.</summary>
public static class ActivityActions
{
    public const string Login = "Login";
    public const string Logout = "Logout";
    public const string Register = "Register";
    public const string PostBlog = "PostBlog";
    public const string Comment = "Comment";
    public const string LikeComment = "LikeComment";
    public const string DraftSaved = "DraftSaved";
    public const string Follow = "Follow";
    public const string Unfollow = "Unfollow";
    public const string UnhandledException = "UnhandledException";
    public const string DeletePost = "DeletePost";
    public const string UpdatePost = "UpdatePost";
    public const string DeleteComment = "DeleteComment";
    public const string AdminAction = "AdminAction";
    public const string LikePost = "LikePost";
    public const string Reaction = "Reaction";
    public const string Bookmark = "Bookmark";
    public const string DraftDeleted = "DraftDeleted";
    public const string ImageAdded = "ImageAdded";
    public const string ImageRemoved = "ImageRemoved";
    public const string ProfileUpdated = "ProfileUpdated";
    public const string RemoveFollower = "RemoveFollower";
    public const string LoginFailed = "LoginFailed";
    public const string OtpSent = "OtpSent";
    public const string OtpVerified = "OtpVerified";
    public const string TokenRefreshed = "TokenRefreshed";
}
