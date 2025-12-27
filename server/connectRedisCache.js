require('dotenv').config();
const { createClient } = require('redis');

async function connectRedisCache(){
    const client = createClient({
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: 'redis-10908.c292.ap-southeast-1-1.ec2.cloud.redislabs.com',
            port: 10908
        }
    });

    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();
    return client;
}

module.exports = connectRedisCache;