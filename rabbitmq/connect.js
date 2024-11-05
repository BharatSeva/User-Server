const amqp = require('amqplib');

let channel, connection;
const QUEUE_NAME = 'appointments_queue';

const connectRabbitMQ = async (rabbitmqURL) => {
    try {
        connection = await amqp.connect(rabbitmqURL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log(`Connected to RabbitMQ - Queue: ${QUEUE_NAME}`);
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        process.exit(1);
    }
};

module.exports = {
    connectRabbitMQ,
    channel: () => channel,
    connection: () => connection,
};