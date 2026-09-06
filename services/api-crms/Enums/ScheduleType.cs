namespace api_crms.Enums;

public enum ScheduleType
{
    // Picked up on the very next scheduled-sweep tick (not a separate sync path).
    SendNow,
    // Fires at/after StartDate.
    Scheduled,
}
