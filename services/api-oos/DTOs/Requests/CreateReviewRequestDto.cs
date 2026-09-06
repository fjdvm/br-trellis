namespace ApiOos.DTOs.Requests;

public class CreateReviewRequestDto
{
    public Guid ProductId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}
