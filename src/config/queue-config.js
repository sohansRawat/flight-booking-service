const amqplib=require('amqplib')

let connection,channel
async function connectQueue(){
    try {
        connection = await amqplib.connect('amqp://localhost')//this will create a connection to Rabbitmq server
        channel=await connection.createChannel()//this will create a channel
        await channel.assertQueue('noti-queue')//this will create a queue
    } catch (error) {
        console.log(error)
    }
}

async function sendData(data){
    try {
        await channel.sendToQueue('noti-queue',Buffer.from(JSON.stringify(data)))
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    connectQueue,
    sendData
}