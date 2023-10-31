import { AxiosWrapper, Params } from "./axios-wrapper"
import { Post } from "./discourse-post"
import { DiscoursePosts } from "./discourse-posts"


export class DiscourseClient {
    private readonly token?: string
    private readonly user?: string
    private readonly category?: number
    private axiosInstance: AxiosWrapper

    constructor(token: string, user: string, category: number, url: string) {
        this.user = user
        this.token = token
        this.category = category
        this.axiosInstance = new AxiosWrapper(url)
    }

    async getPosts(topicId: number): Promise<Post[]> {
        let posts: Post[] = []
        try {
            let resp = await this.axiosInstance.get<DiscoursePosts>(`/t/${topicId}/posts.json`, {
                headers: { 
                  "Api-Key": this.token,
                  "Api-Username": this.user
                }})

            for (let post of resp.data.post_stream.posts) {
                let postResponse = await this.axiosInstance.get<Post>(`/posts/${post.id}.json`, {
                    headers: { 
                      "Api-Key": this.token,
                      "Api-Username": this.user
                    }})
                posts.push(postResponse.data)
            }
            
            return posts
        } catch (error: any) {
            throw new Error(error)
        }
    }

    async createPost(topicId: number, raw: string): Promise<any> {
        const params: Params = {
            unlist_topic: false,
            is_warning: false,
            archetype: "regular",
            nested_post: true,
            topic_id: topicId!,
            raw: raw!
        }

        const data = Object.keys(params)
        .map((key, index) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
        try {
            let resp = await this.axiosInstance.post<any>("/posts", data,
                {headers: { 
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Api-Key": this.token,
                  "Api-Username": this.user
                }})
            return resp.data

        } catch (error: any) {
            throw new Error(error)
        }
    }
}