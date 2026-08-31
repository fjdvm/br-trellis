namespace ApiOos.Interfaces.Services;

public interface ISentraCxService
{
    Task<string> CreateSupportTicketAsync(Guid userId, string userName, string userEmail);
    Task<string> ProxyGetAsync(string path);
    Task<(string Content, int StatusCode)> ProxyPostAsync(string path, object body);
    Task<bool> ProxyDeleteAsync(string path);
}
