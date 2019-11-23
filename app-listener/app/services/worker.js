var amqp = require('amqplib/callback_api');
var config = require('../../config');

amqp.connect(config.rabbitMQConnectionString, function (err, conn) 
{
    conn.createChannel(function (err, ch) 
    {
        let queueOptions = { 
            durable: false,
            arguments : {
                "x-dead-letter-exchange": config.rabbitMQDeadLetterExchange,
                "x-dead-letter-routing-key": config.rabbitMQDeadLetterRoutingKey
            }
        };

        ch.assertQueue(config.rabbitMQQueue, queueOptions);
        ch.prefetch(1);
        ch.consume(config.rabbitMQQueue, function (msg)
        {
            if (!msg.properties.headers["x-death"])
            {
                console.log("[worker][0] message processed");
                ch.nack(msg, false, false);
            }
            else
            {
                let counter = msg.properties.headers["x-death"][0].count;
                console.log("[worker]["+counter+"] message processed");

                if (counter == 5)
                {
                    console.log("[worker][5] message ignored");
                    ch.ack(msg);
                }
                else
                {
                    ch.nack(msg, false, false);
                }
            }
        });
    });
});