import { getBackendApiUrl } from '@/src/api/config';
import { getActiveWorkspaceId } from '@/src/api/workspace-utils';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface Conversation {
    id: string;
    workspace_id: string;
    type: 'direct' | 'group';
    name: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    participant_ids: string[];
    participants: ConversationParticipant[];
    last_message?: ChatMessage;
    unread_count: number;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    type: 'text' | 'task_ref' | 'asset_ref' | 'attachment';
    body: string;
    ref_id?: string;
    media_url?: string;
    edited_at?: string;
    created_at: string;
}

export interface ConversationsListResponse {
    conversations: Conversation[];
    pagination: { page: number; page_size: number; total: number; total_pages: number };
}

export interface ConversationResponse {
    conversation: Conversation;
}

export interface MessagesListResponse {
    messages: ChatMessage[];
    next_cursor: string;
}

export interface MessageResponse {
    message: ChatMessage;
}

export interface CreateConversationBody {
    type: 'direct' | 'group';
    name?: string;
    participant_ids: string[];
}

export interface ConversationParticipant {
    conversation_id: string;
    user_id: string;
    name: string;
    username: string;
    email: string;
    joined_at: string;
}

export interface ParticipantsResponse {
    participants: ConversationParticipant[];
}

export interface SendMessageBody {
    type?: string;
    body?: string;
    ref_id?: string;
}

// --------------------------------------------------------------------------
// Base API
// --------------------------------------------------------------------------

class BaseAPI {
    protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${getBackendApiUrl()}${endpoint}`;
        const workspaceID = getActiveWorkspaceId();
        const existingHeaders = options?.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options?.headers as Record<string, string> | undefined);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(existingHeaders ?? {}),
        };
        if (workspaceID) {
            headers['X-Workspace-ID'] = workspaceID;
        }
        const res = await fetch(url, { credentials: 'include', headers, ...options });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || `Request failed: ${res.status}`);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : (undefined as unknown as T);
    }

    protected fetchGet<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    protected fetchPost<T, B>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
    }

    protected fetchDelete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// --------------------------------------------------------------------------
// Conversations API
// --------------------------------------------------------------------------

class ConversationsAPI extends BaseAPI {
    list(workspaceId: string): Promise<ConversationsListResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}/conversations`);
    }

    get(workspaceId: string, conversationId: string): Promise<ConversationResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}/conversations/${conversationId}`);
    }

    listParticipants(workspaceId: string, conversationId: string): Promise<ParticipantsResponse> {
        return this.fetchGet(`/workspaces/${workspaceId}/conversations/${conversationId}/participants`);
    }

    create(workspaceId: string, body: CreateConversationBody): Promise<ConversationResponse> {
        return this.fetchPost(`/workspaces/${workspaceId}/conversations`, body);
    }

    delete(workspaceId: string, conversationId: string): Promise<void> {
        return this.fetchDelete(`/workspaces/${workspaceId}/conversations/${conversationId}`);
    }

    markRead(workspaceId: string, conversationId: string): Promise<void> {
        return this.fetchPost(`/workspaces/${workspaceId}/conversations/${conversationId}/read`, {});
    }
}

// --------------------------------------------------------------------------
// Messages API
// --------------------------------------------------------------------------

class MessagesAPI extends BaseAPI {
    list(
        workspaceId: string,
        conversationId: string,
        params?: { before_id?: string; limit?: number }
    ): Promise<MessagesListResponse> {
        const query = new URLSearchParams();
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.before_id) query.set('before_id', params.before_id);
        const qs = query.toString() ? `?${query.toString()}` : '';
        return this.fetchGet(`/workspaces/${workspaceId}/conversations/${conversationId}/messages${qs}`);
    }

    send(workspaceId: string, conversationId: string, body: SendMessageBody): Promise<MessageResponse> {
        return this.fetchPost(
            `/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
            body
        );
    }

    async sendAttachment(workspaceId: string, conversationId: string, file: File): Promise<MessageResponse> {
        const url = `${getBackendApiUrl()}/workspaces/${workspaceId}/conversations/${conversationId}/messages`;
        const workspaceID = getActiveWorkspaceId();
        const headers: Record<string, string> = {};
        if (workspaceID) headers['X-Workspace-ID'] = workspaceID;

        const form = new FormData();
        form.append('file', file);

        const res = await fetch(url, { method: 'POST', credentials: 'include', headers, body: form });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || `Request failed: ${res.status}`);
        }
        return res.json();
    }

    delete(workspaceId: string, conversationId: string, messageId: string): Promise<void> {
        return this.fetchDelete(
            `/workspaces/${workspaceId}/conversations/${conversationId}/messages/${messageId}`
        );
    }
}

// --------------------------------------------------------------------------
// Export
// --------------------------------------------------------------------------

class ChatManagementAPI {
    readonly conversations = new ConversationsAPI();
    readonly messages = new MessagesAPI();
}

export const chatApi = new ChatManagementAPI();
