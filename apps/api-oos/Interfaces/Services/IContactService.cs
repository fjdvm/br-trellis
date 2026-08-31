namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;

public interface IContactService
{
    Task<ContactInquiryResponseDto> CreateInquiryAsync(CreateContactInquiryRequestDto dto);
}
