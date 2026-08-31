namespace ApiOos.Validators;

using ApiOos.DTOs.Requests;
using FluentValidation;

public class CreateContactInquiryRequestValidator : AbstractValidator<CreateContactInquiryRequestDto>
{
    public CreateContactInquiryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email address is required.");
        RuleFor(x => x.Subject).NotEmpty().WithMessage("Subject is required.");
        RuleFor(x => x.Message).NotEmpty().WithMessage("Message is required.");
    }
}
