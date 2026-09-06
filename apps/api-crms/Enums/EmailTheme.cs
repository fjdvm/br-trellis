namespace api_crms.Enums;

// The fixed set of visual treatments a Block Template (Email-only) can apply.
// Deliberately a closed set of two, not a gallery — see EmailBodyRenderer's
// theme header band.
public enum EmailTheme
{
    VioletToLight,
    LightToViolet,
}
