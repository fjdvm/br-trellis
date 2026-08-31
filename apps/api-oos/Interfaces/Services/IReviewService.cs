namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;

public interface IReviewService
{
    Task<IEnumerable<ReviewResponseDto>> GetByProductIdAsync(Guid productId);
    Task<ReviewResponseDto> CreateReviewAsync(Guid userId, CreateReviewRequestDto dto);
}
