using RabbitMQ.Client;

namespace API.MessageQueue
{
    /// <summary>
    /// RabbitMQ Connection Configuration
    /// </summary>
    public static class RabbitMqConnection
    {
        public static IConnection CreateConnection()
        {
            var factory = new ConnectionFactory()
            {
                HostName = "localhost",
                Port = 5672,
                UserName = "guest",
                Password = "guest",
                AutomaticRecoveryEnabled = true
            };

            return factory.CreateConnection();
        }
    }
}