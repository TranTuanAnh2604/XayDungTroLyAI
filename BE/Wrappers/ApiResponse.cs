namespace Assistant.Wrappers
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Messenger { get; set; } = string.Empty;
        public T? Data { get; set; }
        public bool? RequireOtp { get; set; }

        public ApiResponse(T data,string messenger ="")
        {
            Success = true;
            Data = data;
            Messenger = messenger;
        }
        public ApiResponse(string messenger)
        {
            Success = false;
            Messenger = messenger;
        }
    }
}
