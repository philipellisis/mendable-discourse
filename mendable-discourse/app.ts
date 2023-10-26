import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DiscoursePost } from './discourse-post';

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
    console.log(event.body)
    let post: DiscoursePost = <DiscoursePost>JSON.parse(event.body!)
    console.log(post)
    console.log(post.post.topic_title)
    console.log(post.post.raw)
    try {
        return {
            statusCode: 200,
            body: JSON.parse(event.body!),
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
