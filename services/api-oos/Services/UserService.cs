namespace ApiOos.Services;

using ApiOos.DTOs.Requests.Users;
using ApiOos.DTOs.Responses.Auth;
using ApiOos.DTOs.Responses.Users;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using BCrypt.Net;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IEcommerceWebhookClient _ecommerceWebhookClient;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IEcommerceWebhookClient ecommerceWebhookClient,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _ecommerceWebhookClient = ecommerceWebhookClient;
        _logger = logger;
    }

    public async Task<UserDto> GetMeAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }
        return MapToUserDto(user);
    }

    public async Task<UserDto> UpdateMeAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        if (!string.IsNullOrEmpty(request.PreferredLanguage))
        {
            user.PreferredLanguage = request.PreferredLanguage;
        }

        await _userRepository.UpdateAsync(user);

        // Reflect the profile change (e.g. new name) into api-crms so the CRM
        // Contact stays in sync. Best-effort: a CRM outage must not fail the edit.
        await DispatchCustomerUpdatedAsync(user);

        return MapToUserDto(user);
    }

    private async Task DispatchCustomerUpdatedAsync(User user)
    {
        try
        {
            await _ecommerceWebhookClient.SendAsync(new ApiOos.DTOs.Webhooks.EcommerceWebhookEvent
            {
                EventId = Guid.NewGuid().ToString(),
                EventType = "customer.updated",
                Data = new ApiOos.DTOs.Webhooks.EcommerceWebhookData
                {
                    CustomerEmail = user.Email,
                    Name = user.FullName,
                    OccurredAt = DateTime.UtcNow.ToString("O"),
                },
            });
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception, "Failed to deliver customer.updated webhook for {UserId}.", user.Id);
        }
    }

    public async Task DeleteMeAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        // Capture the email before deletion so the CRM can locate the Contact.
        var email = user.Email;

        await _userRepository.DeleteAsync(user);

        // Propagate the deletion to api-crms so the CRM Contact is soft-deleted too.
        // Best-effort: a CRM outage must not fail the account deletion.
        await DispatchCustomerDeletedAsync(userId, email);
    }

    private async Task DispatchCustomerDeletedAsync(Guid userId, string email)
    {
        try
        {
            await _ecommerceWebhookClient.SendAsync(new ApiOos.DTOs.Webhooks.EcommerceWebhookEvent
            {
                EventId = Guid.NewGuid().ToString(),
                EventType = "customer.deleted",
                Data = new ApiOos.DTOs.Webhooks.EcommerceWebhookData
                {
                    CustomerEmail = email,
                    OccurredAt = DateTime.UtcNow.ToString("O"),
                },
            });
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception, "Failed to deliver customer.deleted webhook for {UserId}.", userId);
        }
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (!BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new AppException("Current password is incorrect.");
        }

        user.PasswordHash = BCrypt.HashPassword(request.NewPassword);
        await _userRepository.UpdateAsync(user);
    }

    public async Task<IEnumerable<AddressDto>> GetAddressesAsync(Guid userId)
    {
        var addresses = await _userRepository.GetAddressesAsync(userId);
        return addresses.Select(MapToAddressDto);
    }

    public async Task<AddressDto> AddAddressAsync(Guid userId, AddressRequest request)
    {
        var address = new Address
        {
            UserId = userId,
            Label = request.Label,
            Street = request.Street,
            City = request.City,
            Province = request.Province,
            PostalCode = request.PostalCode,
            Country = request.Country,
            IsDefault = request.IsDefault
        };

        var created = await _userRepository.AddAddressAsync(address);
        return MapToAddressDto(created);
    }

    public async Task<AddressDto> UpdateAddressAsync(Guid userId, Guid addressId, AddressRequest request)
    {
        var address = await _userRepository.GetAddressByIdAsync(addressId);
        if (address == null || address.UserId != userId)
        {
            throw new NotFoundException("Address not found.");
        }

        address.Label = request.Label;
        address.Street = request.Street;
        address.City = request.City;
        address.Province = request.Province;
        address.PostalCode = request.PostalCode;
        address.Country = request.Country;
        address.IsDefault = request.IsDefault;

        var updated = await _userRepository.UpdateAddressAsync(address);
        return MapToAddressDto(updated);
    }

    public async Task DeleteAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _userRepository.GetAddressByIdAsync(addressId);
        if (address == null || address.UserId != userId)
        {
            throw new NotFoundException("Address not found.");
        }

        await _userRepository.DeleteAddressAsync(addressId);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.AvatarUrl,
            user.PreferredLanguage
        );
    }

    private static AddressDto MapToAddressDto(Address address)
    {
        return new AddressDto(
            address.Id,
            address.Label,
            address.Street,
            address.City,
            address.Province,
            address.PostalCode,
            address.Country,
            address.IsDefault
        );
    }
}
