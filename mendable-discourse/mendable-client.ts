import { AxiosWrapper } from "./axios-wrapper"
import { ChatResponse, Conversation, History } from "./mendable-chat"

export class MendableClient {
    private readonly token?: string
    private axiosInstance: AxiosWrapper

    constructor(token: string) {
        this.token = token
        this.axiosInstance = new AxiosWrapper("https://api.mendable.ai/v0")

    }

    async createConversation(): Promise<Conversation> {
        console.log(`creating mendable conversation`)
        try {
            let resp = await this.axiosInstance.post<Conversation>("/newConversation", {
                api_key: this.token
            })
            return resp.data

        } catch (error: any) {
            throw new Error(error)
        }
    }

    async chat(conversationId: number, question: string, history: History[], additionalContext: string): Promise<ChatResponse> {
        console.log(`creating a chat with mendable, question: ${question.substring(0, 20)}`)
        try {
            let resp = await this.axiosInstance.post<ChatResponse>("/mendableChat", {
                api_key: this.token,
                question: question,
                history: history,
                conversation_id: conversationId,
                additional_context: additionalContext,
                shouldStream: false
            })
            return resp.data

        } catch (error: any) {
            throw new Error(error)
        }
    }
}