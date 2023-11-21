import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DiscoursePost } from './discourse-post';
import {Axios} from 'axios';
import { MendableClient } from './mendable-client';
import { DiscourseClient } from './discourse-client';
import { ChatResponse, History } from './mendable-chat';
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let post: DiscoursePost = <DiscoursePost>JSON.parse(event.body!)
    console.log(`lambda started for post ${post.post.post_number} in topic: ${post.post.topic_id}`)
    if (post.post.post_number == 1) {
        console.log(`first post in topic: ${post.post.topic_id} creating initial AI response`)
        let mendableClient = new MendableClient(process.env.MENDABLE_API_KEY!)
        let conversation = await mendableClient.createConversation()
        let chatResponse = await mendableClient.chat(
            conversation.conversation_id, 
            post.post.raw, 
            [], 
            `The topic title for this conversation is: ${post.post.topic_title}`
        )
        //console.log("chat response: " +  chatResponse.answer.text)
    
        let fullAnswer = addMessageContext(chatResponse);
        let discourseClient = new DiscourseClient(process.env.DISCOURSE_API_KEY!, process.env.DISCOURSE_USERNAME!, process.env.DISCOURSE_URL!)
        let discoursePost = await discourseClient.createPost(post.post.topic_id, fullAnswer)
        console.log(`created post ${discoursePost.post.id}`)
    } else {
        console.log(`post ${post.post.post_number} in topic: ${post.post.topic_id}`)
        if ( post.post.raw.includes("@" + process.env.DISCOURSE_USERNAME!) || (post.post.reply_to_user && post.post.reply_to_user.username === process.env.DISCOURSE_USERNAME)) {
            console.log(`post ${post.post.post_number} in topic: ${post.post.topic_id} contains a mention of the bot`)
            let discourseClient = new DiscourseClient(process.env.DISCOURSE_API_KEY!, process.env.DISCOURSE_USERNAME!, process.env.DISCOURSE_URL!)
            let discoursePosts = await discourseClient.getPosts(post.post.topic_id)
            // order discoursePosts by post_number ascending
            discoursePosts.sort((a, b) => (a.post_number > b.post_number) ? 1 : -1)
            // remove last post from discoursePosts since it is the post we are responding to
            discoursePosts.pop()
            let history: History[] = []
            let additionalContext = `The topic title for this conversation is: ${post.post.topic_title}\n\nOther posts in this topic not directly related to a question and answer pair:\n\n`
            let nextPostIsAnswer = false
            let index = 0
            for (let post of discoursePosts) {
                if ((post.post_number == 1 || post.raw.includes("@" + process.env.DISCOURSE_USERNAME!) || (post.reply_to_user && post.reply_to_user.username === process.env.DISCOURSE_USERNAME)) && discoursePosts.length > index) {
                    console.log(`post ${post.post_number} is a question and there is another post after it as the answer`)
                    history.push({prompt: post.raw, response: ""})
                    nextPostIsAnswer = true
                } else if (nextPostIsAnswer) {
                    history[history.length - 1].response = post.raw
                    nextPostIsAnswer = false
                } else {
                    console.log(`post ${post.post_number} is not a question so just adding it as additional context`)
                    additionalContext += post.raw + "\n\n"
                }
                index++
            }
            console.log(`created ${history.length} history items`)
            let mendableClient = new MendableClient(process.env.MENDABLE_API_KEY!)
            let conversation = await mendableClient.createConversation()
            let chatResponse = await mendableClient.chat(
                conversation.conversation_id,
                post.post.raw, 
                history, 
                additionalContext
            )
            let fullAnswer = addMessageContext(chatResponse);
            let discoursePost = await discourseClient.createPost(post.post.topic_id, fullAnswer)
            console.log(`created post ${discoursePost.post.id}`)
        } else {
            console.log(`post ${post.post.post_number} in topic: ${post.post.topic_id} does not contain a mention of the bot so just exiting function`)
        }
    }

    
    try {
        return {
            statusCode: 200,
            body: JSON.stringify({message: "success"}),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
function addMessageContext(chatResponse: ChatResponse): string {
    
    let fullAnswer = `Message from ${process.env.DISCOURSE_USERNAME!}:\n\n`
    fullAnswer += chatResponse.answer.text;
    fullAnswer += `\n\nSources referenced for answer:`;
    for (let source of chatResponse.sources) {
        fullAnswer += `\n\n- ${source.link}`;
    }
    // ensure all mentions of the bot are replaced with the bot's username in discourse
    fullAnswer.replace("@" + process.env.DISCOURSE_USERNAME!, process.env.DISCOURSE_USERNAME!)
    return fullAnswer
}
