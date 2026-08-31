namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests.Users;
using ApiOos.DTOs.Responses.Auth;
using ApiOos.DTOs.Responses.Users;

public interface IUserService
{
    Task<UserDto> GetMeAsync(Guid userId);
    Task<UserDto> UpdateMeAsync(Guid userId, UpdateProfileRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

    Task<IEnumerable<AddressDto>> GetAddressesAsync(Guid userId);
    Task<AddressDto> AddAddressAsync(Guid userId, AddressRequest request);
    Task<AddressDto> UpdateAddressAsync(Guid userId, Guid addressId, AddressRequest request);
    Task DeleteAddressAsync(Guid userId, Guid addressId);
}
