using System.Net;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace api_crms.Helpers;

public static class EmailBodyRenderer
{
    public static string RenderToHtml(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return string.Empty;
        }

        var trimmed = body.Trim();
        if (!trimmed.StartsWith("{") && !trimmed.StartsWith("["))
        {
            return body;
        }

        try
        {
            using var doc = JsonDocument.Parse(trimmed);
            var root = doc.RootElement;

            if (root.ValueKind == JsonValueKind.Object)
            {
                var content = RenderJsonObject(root);
                if (!string.IsNullOrWhiteSpace(content))
                {
                    return WrapInEmailContainer(content);
                }
            }
            else if (root.ValueKind == JsonValueKind.Array)
            {
                var content = RenderJsonArray(root);
                if (!string.IsNullOrWhiteSpace(content))
                {
                    return WrapInEmailContainer(content);
                }
            }
        }
        catch (JsonException)
        {
            // Fall back to original body if JSON parsing fails
        }

        return body;
    }

    private static string RenderJsonObject(JsonElement root)
    {
        var html = new System.Text.StringBuilder();

        foreach (var property in root.EnumerateObject())
        {
            var val = property.Value;

            switch (val.ValueKind)
            {
                case JsonValueKind.String:
                    {
                        var text = val.GetString();
                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            var encoded = HtmlEncoder.Default.Encode(text).Replace("\n", "<br/>");
                            html.Append($"<p style=\"font-size:16px;line-height:1.6;color:#374151;margin:12px 0;\">{encoded}</p>");
                        }
                        break;
                    }

                case JsonValueKind.Object:
                    {
                        var text = val.TryGetProperty("text", out var textProp) ? textProp.GetString() : null;
                        var url = val.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;
                        var alt = val.TryGetProperty("alt", out var altProp) ? altProp.GetString() : null;

                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            var targetUrl = !string.IsNullOrWhiteSpace(url) ? HtmlEncoder.Default.Encode(url) : "#";
                            var encodedText = HtmlEncoder.Default.Encode(text);
                            html.Append($"<div style=\"margin:16px 0;text-align:center;\"><a href=\"{targetUrl}\" style=\"display:inline-block;padding:12px 24px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;\">{encodedText}</a></div>");
                        }
                        else if (!string.IsNullOrWhiteSpace(url))
                        {
                            var encodedUrl = HtmlEncoder.Default.Encode(url);
                            var encodedAlt = !string.IsNullOrWhiteSpace(alt) ? HtmlEncoder.Default.Encode(alt) : "";
                            html.Append($"<div style=\"margin:16px 0;text-align:center;\"><img src=\"{encodedUrl}\" alt=\"{encodedAlt}\" style=\"max-width:100%;height:auto;border-radius:8px;\" /></div>");
                        }
                        break;
                    }

                case JsonValueKind.Array:
                    {
                        foreach (var item in val.EnumerateArray())
                        {
                            if (item.ValueKind == JsonValueKind.Object)
                            {
                                var imgUrl = item.TryGetProperty("imageUrl", out var imgProp) ? imgProp.GetString()
                                    : item.TryGetProperty("url", out var uProp) ? uProp.GetString() : null;
                                var caption = item.TryGetProperty("caption", out var capProp) ? capProp.GetString() : null;
                                var linkUrl = item.TryGetProperty("linkUrl", out var linkProp) ? linkProp.GetString()
                                    : item.TryGetProperty("url", out var lProp) ? lProp.GetString() : null;

                                if (!string.IsNullOrWhiteSpace(imgUrl))
                                {
                                    var encodedImg = HtmlEncoder.Default.Encode(imgUrl);
                                    var encodedCap = !string.IsNullOrWhiteSpace(caption) ? HtmlEncoder.Default.Encode(caption) : "";
                                    html.Append($"<div style=\"margin:16px 0;text-align:center;\"><img src=\"{encodedImg}\" alt=\"{encodedCap}\" style=\"max-width:100%;height:auto;border-radius:8px;\" />");
                                    if (!string.IsNullOrWhiteSpace(caption))
                                    {
                                        html.Append($"<p style=\"font-size:14px;color:#6b7280;margin:6px 0;\">{encodedCap}</p>");
                                    }
                                    if (!string.IsNullOrWhiteSpace(linkUrl) && linkUrl != imgUrl)
                                    {
                                        var encodedLink = HtmlEncoder.Default.Encode(linkUrl);
                                        html.Append($"<p style=\"margin:4px 0;\"><a href=\"{encodedLink}\" style=\"color:#7c3aed;text-decoration:underline;font-size:14px;\">Learn More</a></p>");
                                    }
                                    html.Append("</div>");
                                }
                            }
                        }
                        break;
                    }
            }
        }

        return html.ToString();
    }

    private static string RenderJsonArray(JsonElement root)
    {
        var html = new System.Text.StringBuilder();

        foreach (var item in root.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;

            var type = item.TryGetProperty("type", out var typeProp) ? typeProp.GetString() : "text";
            var label = item.TryGetProperty("label", out var labelProp) ? labelProp.GetString() : "";
            var textAlign = item.TryGetProperty("textAlign", out var alignProp) ? alignProp.GetString() : "left";
            var isBold = item.TryGetProperty("isBold", out var boldProp) && boldProp.GetBoolean();
            var isItalic = item.TryGetProperty("isItalic", out var italicProp) && italicProp.GetBoolean();

            var alignStyle = textAlign switch
            {
                "center" => "text-align:center;",
                "right" => "text-align:right;",
                _ => "text-align:left;"
            };

            var fontStyle = $"{(isBold ? "font-weight:bold;" : "")}{(isItalic ? "font-style:italic;" : "")}";

            // Content can be string or object
            if (item.TryGetProperty("content", out var contentProp))
            {
                if (contentProp.ValueKind == JsonValueKind.String)
                {
                    var text = contentProp.GetString();
                    var displayText = !string.IsNullOrWhiteSpace(text) ? text : label;
                    if (!string.IsNullOrWhiteSpace(displayText))
                    {
                        var encoded = HtmlEncoder.Default.Encode(displayText).Replace("\n", "<br/>");
                        if (type == "heading")
                        {
                            html.Append($"<h2 style=\"font-size:20px;font-weight:bold;color:#111827;margin:16px 0 8px 0;{alignStyle}\">{encoded}</h2>");
                        }
                        else
                        {
                            html.Append($"<p style=\"font-size:16px;line-height:1.6;color:#374151;margin:8px 0;{alignStyle}{fontStyle}\">{encoded}</p>");
                        }
                    }
                }
                else if (contentProp.ValueKind == JsonValueKind.Object)
                {
                    var text = contentProp.TryGetProperty("text", out var tProp) ? tProp.GetString() : null;
                    var url = contentProp.TryGetProperty("url", out var uProp) ? uProp.GetString() : null;
                    var alt = contentProp.TryGetProperty("alt", out var aProp) ? aProp.GetString() : null;

                    if (type == "button" || !string.IsNullOrWhiteSpace(text))
                    {
                        var btnText = !string.IsNullOrWhiteSpace(text) ? text : label;
                        var targetUrl = !string.IsNullOrWhiteSpace(url) ? HtmlEncoder.Default.Encode(url) : "#";
                        var encodedText = HtmlEncoder.Default.Encode(btnText);
                        html.Append($"<div style=\"margin:16px 0;{alignStyle}\"><a href=\"{targetUrl}\" style=\"display:inline-block;padding:12px 24px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;\">{encodedText}</a></div>");
                    }
                    else if (type == "image" || !string.IsNullOrWhiteSpace(url))
                    {
                        if (!string.IsNullOrWhiteSpace(url))
                        {
                            var encodedUrl = HtmlEncoder.Default.Encode(url);
                            var encodedAlt = !string.IsNullOrWhiteSpace(alt) ? HtmlEncoder.Default.Encode(alt) : HtmlEncoder.Default.Encode(label);
                            html.Append($"<div style=\"margin:16px 0;{alignStyle}\"><img src=\"{encodedUrl}\" alt=\"{encodedAlt}\" style=\"max-width:100%;height:auto;border-radius:8px;\" /></div>");
                        }
                    }
                    else if (type == "link")
                    {
                        var linkText = !string.IsNullOrWhiteSpace(text) ? text : label;
                        var targetUrl = !string.IsNullOrWhiteSpace(url) ? HtmlEncoder.Default.Encode(url) : "#";
                        var encodedText = HtmlEncoder.Default.Encode(linkText);
                        html.Append($"<div style=\"margin:8px 0;{alignStyle}\"><a href=\"{targetUrl}\" style=\"color:#7c3aed;text-decoration:underline;font-size:16px;\">{encodedText}</a></div>");
                    }
                }
                else if (contentProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var slide in contentProp.EnumerateArray())
                    {
                        if (slide.ValueKind == JsonValueKind.Object)
                        {
                            var imgUrl = slide.TryGetProperty("imageUrl", out var imgProp) ? imgProp.GetString() : null;
                            var caption = slide.TryGetProperty("caption", out var capProp) ? capProp.GetString() : null;
                            var linkUrl = slide.TryGetProperty("linkUrl", out var linkProp) ? linkProp.GetString() : null;

                            if (!string.IsNullOrWhiteSpace(imgUrl))
                            {
                                var encodedImg = HtmlEncoder.Default.Encode(imgUrl);
                                var encodedCap = !string.IsNullOrWhiteSpace(caption) ? HtmlEncoder.Default.Encode(caption) : "";
                                html.Append($"<div style=\"margin:16px 0;{alignStyle}\"><img src=\"{encodedImg}\" alt=\"{encodedCap}\" style=\"max-width:100%;height:auto;border-radius:8px;\" />");
                                if (!string.IsNullOrWhiteSpace(caption))
                                {
                                    html.Append($"<p style=\"font-size:14px;color:#6b7280;margin:6px 0;\">{encodedCap}</p>");
                                }
                                if (!string.IsNullOrWhiteSpace(linkUrl) && linkUrl != imgUrl)
                                {
                                    var encodedLink = HtmlEncoder.Default.Encode(linkUrl);
                                    html.Append($"<p style=\"margin:4px 0;\"><a href=\"{encodedLink}\" style=\"color:#7c3aed;text-decoration:underline;font-size:14px;\">Learn More</a></p>");
                                }
                                html.Append("</div>");
                            }
                        }
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(label))
            {
                var encoded = HtmlEncoder.Default.Encode(label);
                html.Append($"<p style=\"font-size:16px;line-height:1.6;color:#374151;margin:8px 0;{alignStyle}{fontStyle}\">{encoded}</p>");
            }
        }

        return html.ToString();
    }

    private static string WrapInEmailContainer(string content)
    {
        return $"<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333; line-height: 1.6;\">{content}</div>";
    }
}
