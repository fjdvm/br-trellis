namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetByProduct([FromQuery] Guid productId)
    {
        var reviews = await _reviewService.GetByProductIdAsync(productId);
        return Ok(reviews);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewResponseDto>> Create([FromBody] CreateReviewRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var review = await _reviewService.CreateReviewAsync(userId, dto);
        return Ok(review);
    }

    private Guid GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (subClaim == null || !Guid.TryParse(subClaim.Value, out var userId))
        {
            throw new UnauthorizedException("User ID claim is missing or invalid.");
        }
        return userId;
    }
}
