namespace api_crms.CustomerIdentity;

public sealed class CustomerIdentityOptions
{
    public const decimal DefaultAutoAcceptThreshold = 0.9m;
    public const decimal DefaultNoiseFloor = 0.1m;

    public decimal AutoAcceptThreshold { get; init; } = DefaultAutoAcceptThreshold;

    public decimal NoiseFloor { get; init; } = DefaultNoiseFloor;
}
