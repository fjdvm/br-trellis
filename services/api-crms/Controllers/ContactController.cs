using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/contacts")]
public sealed class ContactController(
    IContactService contactService,
    ICustomFieldService customFieldService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ContactListItemDto>>> ListContacts(
        CancellationToken cancellationToken)
    {
        return Ok(await contactService.ListContactsAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContactDetailDto>> GetContact(
        Guid id,
        CancellationToken cancellationToken)
    {
        var contact = await contactService.GetContactByIdAsync(id, cancellationToken);
        return contact is null ? NotFound() : Ok(contact);
    }

    [HttpPost]
    public async Task<ActionResult<ContactDetailDto>> CreateContact(
        CreateContactDto input,
        CancellationToken cancellationToken)
    {
        var contact = await contactService.CreateContactAsync(input, cancellationToken);
        return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
    }

    [HttpPut("{id:guid}/custom-fields")]
    public async Task<IActionResult> UpdateCustomFieldValue(
        Guid id,
        CustomFieldValueUpdateDto update,
        CancellationToken cancellationToken)
    {
        await customFieldService.UpdateValueAsync(id, update, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ContactDetailDto>> UpdateContact(
        Guid id,
        UpdateContactDto input,
        CancellationToken cancellationToken)
    {
        var contact = await contactService.UpdateContactAsync(id, input, cancellationToken);
        return contact is null ? NotFound() : Ok(contact);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteContact(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted = await contactService.DeleteContactAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    // Marketing unsubscribe target (#162). Called server-to-server by api-oos when
    // a shopper clicks the unsubscribe link in a Campaign email. Unauthenticated,
    // idempotent — succeeds even when no matching Contact exists.
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [HttpPost("opt-out")]
    public async Task<IActionResult> OptOut(
        MarketingOptOutDto input,
        CancellationToken cancellationToken)
    {
        await contactService.SetMarketingOptOutByEmailAsync(input.Email, cancellationToken);
        return NoContent();
    }
}
