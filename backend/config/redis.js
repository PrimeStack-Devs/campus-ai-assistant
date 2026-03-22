import { createClient } from 'redis';

const client = createClient({
    url: "redis://default:hcZqlCRB4gaTvgc92p6Y4TOXnnM0Ydiw@redis-17493.crce276.ap-south-1-3.ec2.cloud.redislabs.com:17493" // ✅ SIMPLE + RELIABLE
});

client.on('error', err => console.log('Redis Error', err));

export async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log("✅ Redis Connected");
    }
}

export default client;