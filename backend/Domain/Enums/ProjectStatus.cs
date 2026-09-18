namespace Domain.Enums
{
    public enum ProjectStatus
    {
        InProgress = 2,
        Finished = 3,
        Cancelled = 7,

        // Backward compatibility & aliases
        Submitted = 0,
        Planning = 1,
        Working = 2,
        Overdue = 4,
        Rejected = 5,
        OnHold = 6,
        Canceled = 7
    }
}
