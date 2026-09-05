using api_crms.Helpers;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class EmailBodyRendererTests
{
    [Fact]
    public void RenderToHtml_returns_empty_string_when_body_is_null_or_empty()
    {
        Assert.Equal(string.Empty, EmailBodyRenderer.RenderToHtml(null));
        Assert.Equal(string.Empty, EmailBodyRenderer.RenderToHtml("   "));
    }

    [Fact]
    public void RenderToHtml_returns_original_body_when_not_json()
    {
        var rawHtml = "<div><p>Hello World</p></div>";
        Assert.Equal(rawHtml, EmailBodyRenderer.RenderToHtml(rawHtml));
    }

    [Fact]
    public void RenderToHtml_renders_json_object_dictionary_to_html_components()
    {
        var jsonDict = @"{
            ""bcd66671-5667-41bf-bc3b-756094604d46"": ""Hi Test"",
            ""28c3fda7-4759-4c07-81fd-82f754798afe"": ""asfasdfasdf"",
            ""e4c4a282-97d4-483e-a591-1e64fa48a615"": {
                ""url"": ""https://img.magnific.com/free-photo/closeup-shot-beautiful-butterfly.jpg"",
                ""alt"": ""Butterfly""
            },
            ""400a7222-048f-4984-b506-2cadab0ac47a"": [
                {
                    ""imageUrl"": ""https://img.magnific.com/free-photo/closeup-shot-beautiful-butterfly.jpg"",
                    ""caption"": ""Slide 1"",
                    ""linkUrl"": ""https://example.com/slide1""
                }
            ],
            ""btn1"": {
                ""text"": ""Shop Now"",
                ""url"": ""https://example.com/shop""
            }
        }";

        var rendered = EmailBodyRenderer.RenderToHtml(jsonDict);

        Assert.Contains("<p style=\"font-size:16px;line-height:1.6;color:#374151;margin:12px 0;\">Hi Test</p>", rendered);
        Assert.Contains("<p style=\"font-size:16px;line-height:1.6;color:#374151;margin:12px 0;\">asfasdfasdf</p>", rendered);
        Assert.Contains("<img src=\"https://img.magnific.com/free-photo/closeup-shot-beautiful-butterfly.jpg\" alt=\"Butterfly\"", rendered);
        Assert.Contains("Shop Now", rendered);
        Assert.Contains("https://example.com/shop", rendered);
        Assert.Contains("Slide 1", rendered);
    }

    [Fact]
    public void RenderToHtml_renders_json_array_blocks_to_html_components()
    {
        var jsonArray = @"[
            { ""type"": ""heading"", ""label"": ""Main Title"", ""content"": ""Summer Sale!"", ""textAlign"": ""center"" },
            { ""type"": ""text"", ""label"": ""Description"", ""content"": ""Get up to 50% off."", ""isBold"": true },
            { ""type"": ""button"", ""label"": ""CTA"", ""content"": { ""text"": ""Buy Now"", ""url"": ""https://example.com/buy"" } }
        ]";

        var rendered = EmailBodyRenderer.RenderToHtml(jsonArray);

        Assert.Contains("<h2 style=\"font-size:20px;font-weight:bold;color:#111827;margin:16px 0 8px 0;text-align:center;\">Summer Sale!</h2>", rendered);
        Assert.Contains("Get up to 50% off.", rendered);
        Assert.Contains("font-weight:bold;", rendered);
        Assert.Contains("Buy Now", rendered);
        Assert.Contains("https://example.com/buy", rendered);
    }
}
