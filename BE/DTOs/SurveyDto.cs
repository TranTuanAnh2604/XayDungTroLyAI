namespace Assistant.Models
{
    public class SurveyDto
    {
        public List<string> SupportAreas { get; set; } = new();      
        public string ResponseStyle { get; set; } = "";               
        public List<string> Priorities { get; set; } = new();         
        public List<string> Traits { get; set; } = new();             
        public List<string> ProactiveSupport { get; set; } = new();
        public List<string>? Hobbies { get; set; }
        public List<string>? MusicGenres { get; set; }
        public List<string>? FavoriteFoods { get; set; }
        public List<string>? AiPersonality { get; set; }
        public List<string>? PersonalPreferences { get; set; }
    }
}