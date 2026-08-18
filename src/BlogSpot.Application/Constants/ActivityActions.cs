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
}
