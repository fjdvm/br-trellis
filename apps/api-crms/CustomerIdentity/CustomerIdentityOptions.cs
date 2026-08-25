namespace api_crms.CustomerIdentity;

public sealed class CustomerIdentityOptions
{
    public const decimal DefaultAutoAcceptThreshold = 0.9m;

    public decimal AutoAcceptThreshold { get; init; } = DefaultAutoAcceptThreshold;
}
