using ApiOos.DTOs.Chat;
using ApiOos.Interfaces.Services;
using ApiOos.Services;
using FluentAssertions;
using Xunit;

namespace ApiOos.Tests.Chat;

/// <summary>
/// Covers #125: staff replies fetched by polling api-crms are relayed down the hub.
/// The critical assertion (user story 30) is that a message returned by a FAKED poll
/// response is actually broadcast to the conversation — observable on the hub — not
/// merely that the poll call fired.
/// </summary>
public sealed class StaffReplyRelayServiceTests
{
    [Fact]
    public async Task PollOnce_relays_staff_message_from_poll_down_the_hub()
    {
        var registry = new InMemoryChatSessionRegistry();
        registry.Register("conv-1");

        var reader = new FakeCrmMessageReader();
        reader.Messages["conv-1"] =
        [
            new CrmMessage
            {
                Id = "m1",
                SenderType = "Staff",
                SenderStaffName = "Amelia",
                Content = "Your order ships today!",
                SentAt = DateTimeOffset.UtcNow,
            },
        ];

        var broadcaster = new FakeChatBroadcaster();
        var service = new StaffReplyRelayService(registry, reader, broadcaster);

        await service.PollOnceAsync(CancellationToken.None);

        // Observable on the hub for the conversation.
        broadcaster.Broadcasts.Should().ContainSingle();
        var (conversationId, message) = broadcaster.Broadcasts.Single();
        conversationId.Should().Be("conv-1");
        message.Content.Should().Be("Your order ships today!");
        message.SenderType.Should().Be("agent");
        message.SenderName.Should().Be("Amelia");
    }

    [Fact]
    public async Task PollOnce_does_not_relay_customer_messages()
    {
        var registry = new InMemoryChatSessionRegistry();
        registry.Register("conv-1");
        var reader = new FakeCrmMessageReader();
        reader.Messages["conv-1"] =
        [
            new CrmMessage
            {
                Id = "m1", SenderType = "Contact", Content = "my own message",
                SentAt = DateTimeOffset.UtcNow,
            },
        ];
        var broadcaster = new FakeChatBroadcaster();
        var service = new StaffReplyRelayService(registry, reader, broadcaster);

        await service.PollOnceAsync(CancellationToken.None);

        broadcaster.Broadcasts.Should().BeEmpty("only staff replies are relayed to the browser");
    }

    [Fact]
    public async Task PollOnce_advances_watermark_so_a_staff_message_is_relayed_once()
    {
        var registry = new InMemoryChatSessionRegistry();
        registry.Register("conv-1");
        var reader = new FakeCrmMessageReader();
        var sentAt = DateTimeOffset.UtcNow;
        reader.Messages["conv-1"] =
        [
            new CrmMessage { Id = "m1", SenderType = "Staff", Content = "hi", SentAt = sentAt },
        ];
        var broadcaster = new FakeChatBroadcaster();
        var service = new StaffReplyRelayService(registry, reader, broadcaster);

        await service.PollOnceAsync(CancellationToken.None);
        await service.PollOnceAsync(CancellationToken.None);

        // The reader honours the watermark, so the second poll returns nothing new.
        broadcaster.Broadcasts.Should().ContainSingle();
        reader.LastSinceFor("conv-1").Should().Be(sentAt);
    }

    [Fact]
    public async Task PollOnce_polls_only_active_conversations()
    {
        var registry = new InMemoryChatSessionRegistry();
        var reader = new FakeCrmMessageReader();
        var service = new StaffReplyRelayService(registry, reader, new FakeChatBroadcaster());

        await service.PollOnceAsync(CancellationToken.None);

        reader.PolledConversationIds.Should().BeEmpty();
    }

    private sealed class FakeCrmMessageReader : ICrmMessageReader
    {
        public Dictionary<string, List<CrmMessage>> Messages { get; } = new();
        public List<string> PolledConversationIds { get; } = [];
        private readonly Dictionary<string, DateTimeOffset?> _lastSince = new();

        public DateTimeOffset? LastSinceFor(string conversationId) =>
            _lastSince.TryGetValue(conversationId, out var v) ? v : null;

        public Task<IReadOnlyList<CrmMessage>> GetMessagesSinceAsync(
            string conversationId, DateTimeOffset? since, CancellationToken cancellationToken = default)
        {
            PolledConversationIds.Add(conversationId);
            _lastSince[conversationId] = since;
            var all = Messages.TryGetValue(conversationId, out var list) ? list : [];
            IReadOnlyList<CrmMessage> filtered = all
                .Where(m => since is null || m.SentAt > since.Value)
                .OrderBy(m => m.SentAt)
                .ToList();
            return Task.FromResult(filtered);
        }
    }

    private sealed class FakeChatBroadcaster : IChatBroadcaster
    {
        public List<(string ConversationId, ChatMessageDto Message)> Broadcasts { get; } = [];

        public Task BroadcastMessageAsync(
            string conversationId, ChatMessageDto message, CancellationToken cancellationToken = default)
        {
            Broadcasts.Add((conversationId, message));
            return Task.CompletedTask;
        }
    }
}
