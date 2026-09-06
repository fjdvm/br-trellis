namespace ApiOos.DTOs.Requests.Users;

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
