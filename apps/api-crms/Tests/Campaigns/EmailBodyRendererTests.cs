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

}
