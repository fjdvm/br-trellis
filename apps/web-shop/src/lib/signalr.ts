import * as signalR from "@microsoft/signalr";

const CRM_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_URL || "http://localhost:5005";

export function createSignalRConnection(hubPath: string = "/hubs/chat"): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${CRM_BASE_URL}${hubPath}`, {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();
}
