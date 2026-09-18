using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using Domain.Enums;

namespace Hero_CRM.Converters
{
    public class ProjectStatusJsonConverter : JsonConverter<ProjectStatus>
    {
        public override ProjectStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                var intVal = reader.GetInt32();
                switch (intVal)
                {
                    case 3:
                        return ProjectStatus.Finished;
                    case 7:
                        return ProjectStatus.Cancelled;
                    default:
                        return ProjectStatus.InProgress;
                }
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var str = reader.GetString()?.Trim();
                if (string.IsNullOrEmpty(str))
                {
                    return ProjectStatus.InProgress;
                }

                var normalized = str.Replace(" ", "").ToLowerInvariant();
                switch (normalized)
                {
                    case "finished":
                    case "completed":
                    case "done":
                        return ProjectStatus.Finished;

                    case "cancelled":
                    case "canceled":
                    case "rejected":
                        return ProjectStatus.Cancelled;

                    case "inprogress":
                    case "working":
                    case "planning":
                    case "submitted":
                    case "onhold":
                    case "overdue":
                    default:
                        return ProjectStatus.InProgress;
                }
            }

            return ProjectStatus.InProgress;
        }

        public override void Write(Utf8JsonWriter writer, ProjectStatus value, JsonSerializerOptions options)
        {
            switch (value)
            {
                case ProjectStatus.Finished:
                    writer.WriteStringValue("Finished");
                    break;
                case ProjectStatus.Cancelled:
                    writer.WriteStringValue("Cancelled");
                    break;
                default:
                    writer.WriteStringValue("In Progress");
                    break;
            }
        }
    }
}

