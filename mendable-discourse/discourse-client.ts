import { AxiosWrapper, Params } from "./axios-wrapper"
import { Post } from "./discourse-post"
import { DiscoursePosts } from "./discourse-posts"


export class DiscourseClient {
    private readonly token?: string
    private readonly user?: string
    private readonly url?: string
    private axiosInstance: AxiosWrapper

    constructor(token: string, user: string, url: string) {
        this.user = user
        this.token = token
        this.url = url
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
        console.log(`Creating post in topic ${topicId} with user ${this.user} and token ${this.token!.substring(0, 5)} with url ${this.url}`)
        const params: Params = {
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