namespace Assistant.DTOs
{
    public class GmailDto
    {
        public string Id { get; set; } = "";
        public string From { get; set; } = "";
        public string Subject { get; set; } = "";
        public string Snippet { get; set; } = "";
        public string Date { get; set; } = "";
        public bool IsUnread { get; set; }
    }

    public class GmailDetailDto
    {
        public string Id { get; set; } = "";
        public string From { get; set; } = "";
        public string To { get; set; } = "";
        public string Subject { get; set; } = "";
        public string Snippet { get; set; } = "";
        public string Date { get; set; } = "";
        public string Body { get; set; } = "";
        public string BodyHtml { get; set; } = "";
        public bool IsUnread { get; set; }
    }
}