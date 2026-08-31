namespace ApiOos.Configurations;

public class CrmSyncOptions
{
    public const string SectionName = "CrmSync";

    public string ServiceToken { get; init; } = string.Empty;
}
