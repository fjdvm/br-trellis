using api_crms.Enums;
using api_crms.DTOs;

namespace api_crms.Validators;

public static class BlockTemplateValidator
{
    public static (bool IsValid, string? ErrorMessage) ValidateConstraints(CampaignChannel channel, IReadOnlyList<CreateTemplateBlockInput> blocks)
    {
        var carouselCount = 0;
        var imageCount = 0;
        var linkCount = 0;
        var headingCount = 0;
        var textCount = 0;
        var buttonCount = 0;

        foreach (var b in blocks)
        {
            var type = b.Type?.Trim().ToLowerInvariant();
            switch (type)
            {
                case "carousel":
                    carouselCount++;
                    break;
                case "image":
                    imageCount++;
                    break;
                case "link":
                    linkCount++;
                    break;
                case "heading":
                    headingCount++;
                    break;
                case "text":
                    textCount++;
                    break;
                case "button":
                    buttonCount++;
                    break;
            }
        }

        switch (channel)
        {
            case CampaignChannel.Email:
                if (carouselCount > 1) return (false, "Email templates allow a maximum of 1 carousel component.");
                if (imageCount > 3) return (false, "Email templates allow a maximum of 3 image components.");
                if (linkCount > 3) return (false, "Email templates allow a maximum of 3 link components.");
                if (headingCount > 3) return (false, "Email templates allow a maximum of 3 heading components.");
                if (textCount > 3) return (false, "Email templates allow a maximum of 3 text components.");
                if (buttonCount > 5) return (false, "Email templates allow a maximum of 5 button components.");
                break;

            case CampaignChannel.Banner:
                if (carouselCount > 0) return (false, "Banner templates do not allow carousel components.");
                if (headingCount > 0) return (false, "Banner templates do not allow heading components.");
                if (imageCount > 1) return (false, "Banner templates allow a maximum of 1 image component.");
                if (linkCount > 1) return (false, "Banner templates allow a maximum of 1 link component.");
                if (textCount > 1) return (false, "Banner templates allow a maximum of 1 text component.");
                if (buttonCount > 5) return (false, "Banner templates allow a maximum of 5 button components.");
                break;

            case CampaignChannel.Popup:
                if (carouselCount > 0) return (false, "Popup templates do not allow carousel components.");
                if (imageCount > 1) return (false, "Popup templates allow a maximum of 1 image component.");
                if (linkCount > 2) return (false, "Popup templates allow a maximum of 2 link components.");
                if (headingCount > 1) return (false, "Popup templates allow a maximum of 1 heading component.");
                if (textCount > 1) return (false, "Popup templates allow a maximum of 1 text component.");
                if (buttonCount > 5) return (false, "Popup templates allow a maximum of 5 button components.");
                break;
        }

        return (true, null);
    }
}
