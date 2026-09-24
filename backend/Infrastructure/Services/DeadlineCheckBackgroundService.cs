using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Services_Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class DeadlineCheckBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeadlineCheckBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public DeadlineCheckBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<DeadlineCheckBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DeadlineCheckBackgroundService is starting (Interval: 1 minute).");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    await notificationService.CheckAndSendDeadlineNotificationsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while checking project and task deadlines.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("DeadlineCheckBackgroundService is stopping.");
        }
    }
}
