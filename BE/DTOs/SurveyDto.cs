namespace Assistant.Models
{
    public class SurveyDto
    {
        public List<string> SupportAreas { get; set; } = new();      
        public string ResponseStyle { get; set; } = "";               
        public List<string> Priorities { get; set; } = new();         
        public List<string> Traits { get; set; } = new();             
        public List<string> ProactiveSupport { get; set; } = new();   
    }
}