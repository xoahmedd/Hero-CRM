using AutoMapper;

// Entities
using Domain.Entities.Collaborations;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Domain.Enums;

// DTOs
using Application.DTOs.Collaborations.Comment;
using Application.DTOs.Collaborations.Notification;
using Application.DTOs.Projects;
using Application.DTOs.Tasks.TaskItem;

namespace Hero_CRM.Mapping
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            // Global ValueTransformer to automatically trim all mapped string properties across the entire application
            ValueTransformers.Add<string>(val => val == null ? null! : val.Trim());

            #region Collaborations Mappings
            CreateMap<Comment, CommentResponse>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.SpecifyKind(src.CreatedAt, DateTimeKind.Utc)))
                .ReverseMap();
            CreateMap<CreateCommentRequest, Comment>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            CreateMap<Notification, NotificationResponse>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.SpecifyKind(src.CreatedAt, DateTimeKind.Utc)))
                .ReverseMap();
            #endregion

            #region Project Mappings
            CreateMap<Project, ProjectResponse>()
                .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.MissedDeadlineReason) ||
                    (src.DueDate.HasValue && src.DueDate.Value < DateTime.UtcNow && src.Status != ProjectStatus.Finished && src.Status != ProjectStatus.Cancelled)));
            CreateMap<ProjectResponse, Project>();

            CreateMap<CreateProjectRequest, Project>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore());

            CreateMap<UpdateProjectRequest, Project>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore());
            CreateMap<ProjectMember, ProjectMemberResponse>();
            #endregion

            #region Task Mappings
            CreateMap<TaskItem, TaskResponse>()
                .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src =>
                    !string.IsNullOrEmpty(src.MissedDeadlineReason) ||
                    (src.DueDate.HasValue && (
                        src.Status == TaskItemStatus.Completed
                            ? (src.CompletedAt.HasValue && src.CompletedAt.Value > src.DueDate.Value)
                            : (src.DueDate.Value < DateTime.UtcNow && src.Status != TaskItemStatus.Cancelled)
                    ))));
            CreateMap<TaskResponse, TaskItem>();
            CreateMap<TaskAssignee, TaskAssigneeResponse>();
            CreateMap<CreateTaskRequest, TaskItem>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            CreateMap<UpdateTaskRequest, TaskItem>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ProjectId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedById, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Condition(src => src.Status.HasValue));
            #endregion
        }
    }
}
