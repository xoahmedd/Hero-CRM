using AutoMapper;

// Entities
using Domain.Entities.Collaborations;
using Domain.Entities.Customers;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Domain.Entities.Teams;
using Domain.Enums;

// DTOs
using Application.DTOs.Collaborations.Activity;
using Application.DTOs.Collaborations.Attachment;
using Application.DTOs.Collaborations.Comment;
using Application.DTOs.Collaborations.Notification;
using Application.DTOs.Customer;
using Application.DTOs.Projects;
using Application.DTOs.Tasks.SubTask;
using Application.DTOs.Tasks.Tag;
using Application.DTOs.Tasks.TaskItem;
using Application.DTOs.Teams;

namespace Hero_CRM.Mapping
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            // Global ValueTransformer to automatically trim all mapped string properties across the entire application
            ValueTransformers.Add<string>(val => val == null ? null! : val.Trim());

            #region Collaborations Mappings
            CreateMap<Activity, ActivityResponse>().ReverseMap();

            CreateMap<Attachment, AttachmentResponse>().ReverseMap();
            CreateMap<CreateAttachmentRequest, Attachment>()
                .ForMember(dest => dest.UploadedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            CreateMap<Comment, CommentResponse>().ReverseMap();
            CreateMap<CreateCommentRequest, Comment>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));
            CreateMap<UpdateCommentRequest, Comment>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.TaskItemId, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<Notification, NotificationResponse>().ReverseMap();
            CreateMap<CreateNotificationRequest, Notification>();
            #endregion

            #region Customer Mappings
            CreateMap<Customer, CustomerResponse>().ReverseMap();
            CreateMap<CreateCustomerRequest, Customer>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email != null ? src.Email.ToLower() : null))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            CreateMap<UpdateCustomerRequest, Customer>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email != null ? src.Email.ToLower() : null))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
            #endregion

            #region Project Mappings
            CreateMap<Project, ProjectResponse>()
                .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src => src.DueDate.HasValue && src.DueDate.Value < DateTime.UtcNow && src.Status != ProjectStatus.Finished));
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
            CreateMap<SubTask, SubTaskResponse>().ReverseMap();
            CreateMap<CreateSubTaskRequest, SubTask>()
                .ForMember(dest => dest.IsCompleted, opt => opt.MapFrom(_ => false));

            CreateMap<UpdateSubTaskRequest, SubTask>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.TaskItemId, opt => opt.Ignore());

            CreateMap<Tag, TagResponse>().ReverseMap();
            CreateMap<CreateTagRequest, Tag>();
            CreateMap<AssignTagRequest, TaskTag>();

            CreateMap<TaskItem, TaskResponse>()
                .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src => src.DueDate.HasValue && src.DueDate.Value < DateTime.UtcNow && src.Status != TaskItemStatus.Completed));
            CreateMap<TaskResponse, TaskItem>();
            CreateMap<TaskAssignee, TaskAssigneeResponse>();
            CreateMap<CreateTaskRequest, TaskItem>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            CreateMap<UpdateTaskRequest, TaskItem>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ProjectId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedById, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
            #endregion

            #region Team Mappings
            CreateMap<Team, TeamResponse>().ReverseMap();
            CreateMap<CreateTeamRequest, Team>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            CreateMap<UpdateTeamRequest, Team>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedById, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
            CreateMap<TeamMember, TeamMemberResponse>();
            #endregion
        }
    }
}
