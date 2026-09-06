namespace ApiOos.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Models;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IUserRepository _userRepository;

    public ReviewService(IReviewRepository reviewRepository, IUserRepository userRepository)
    {
        _reviewRepository = reviewRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetByProductIdAsync(Guid productId)
    {
        var reviews = await _reviewRepository.GetByProductIdAsync(productId);
        return reviews.Select(r => new ReviewResponseDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            UserId = r.UserId,
            UserName = r.User?.FullName ?? "Anonymous",
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt,
        });
    }

    public async Task<ReviewResponseDto> CreateReviewAsync(Guid userId, CreateReviewRequestDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
        {
            throw new AppException("Rating must be between 1 and 5 stars.", 400);
        }

        if (string.IsNullOrWhiteSpace(dto.Comment) || dto.Comment.Length > 500)
        {
            throw new AppException("Comment is required and must not exceed 500 characters.", 400);
        }

        var hasReviewed = await _reviewRepository.HasUserReviewedProductAsync(userId, dto.ProductId);
        if (hasReviewed)
        {
            throw new ConflictException("You have already submitted a review for this product.");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        var review = new ProductReview
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = dto.Rating,
            Comment = dto.Comment.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        var created = await _reviewRepository.CreateAsync(review);

        return new ReviewResponseDto
        {
            Id = created.Id,
            ProductId = created.ProductId,
            UserId = created.UserId,
            UserName = user.FullName,
            Rating = created.Rating,
            Comment = created.Comment,
            CreatedAt = created.CreatedAt,
        };
    }
}
