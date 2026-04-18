import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: '4NKGRf5mOVui4V14snt8958AZSpXqBgd',
    socket: {
        host: 'redis-13412.c11.us-east-1-3.ec2.cloud.redislabs.com',
        port: 13412
    }
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();
console.log("Connected to Redis");


export default redisClient;
