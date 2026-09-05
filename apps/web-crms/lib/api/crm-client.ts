import { customerApi, customerIdentityApi, ordersApi, marketingInteractionsApi } from "@/lib/api/crm/customers-api";
import { contactsApi } from "@/lib/api/crm/contacts-api";
import { campaignsApi, templatesApi } from "@/lib/api/crm/campaigns-api";
import { ticketsApi, conversationTicketsApi, conversationMessagesApi, messagesApi } from "@/lib/api/crm/tickets-api";
import {
  uploadApi,
  ecommerceOrdersApi,
  ecommerceProductsApi,
  ecommerceCartsApi,
  workflowRunsApi,
  segmentsApi,
  companiesApi,
  cannedReplyCategoriesApi,
  cannedRepliesApi,
  ecommerceSyncStatusApi,
} from "@/lib/api/crm/other-api";
import { blockTemplatesApi } from "@/lib/api/crm/campaigns-api";

export const crmClient = {
  customers: customerApi,
  customerIdentity: customerIdentityApi,
  contacts: contactsApi,
  orders: ordersApi,
  marketingInteractions: marketingInteractionsApi,
  campaigns: campaignsApi,
  templates: templatesApi,
  tickets: ticketsApi,
  conversationTickets: conversationTicketsApi,
  conversationMessages: conversationMessagesApi,
  messages: messagesApi,
  upload: uploadApi,
  ecommerceOrders: ecommerceOrdersApi,
  ecommerceProducts: ecommerceProductsApi,
  ecommerceCarts: ecommerceCartsApi,
  workflowRuns: workflowRunsApi,
  segments: segmentsApi,
  companies: companiesApi,
  cannedReplyCategories: cannedReplyCategoriesApi,
  cannedReplies: cannedRepliesApi,
  ecommerceSyncStatus: ecommerceSyncStatusApi,
  blockTemplates: blockTemplatesApi,
};

