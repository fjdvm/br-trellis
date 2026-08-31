import * as signalR from "@microsoft/signalr";

// The chat hub is hosted inside api-oos (never api-crms/SentraCX). Derive api-oos's
// origin from the API base URL by stripping the trailing "/api" path segment.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
const OOS_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function createSignalRConnection(hubPath: string = "/hubs/chat"): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${OOS_ORIGIN}${hubPath}`, {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();
}
