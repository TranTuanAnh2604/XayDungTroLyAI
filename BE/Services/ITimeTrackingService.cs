namespace Assistant.Services;

public interface ITimeTrackingService
{
    System.Threading.Tasks.Task StartSessionAsync(Guid userId);
    System.Threading.Tasks.Task EndSessionAsync(Guid userId);
}