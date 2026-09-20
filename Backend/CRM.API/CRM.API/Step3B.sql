BEGIN TRANSACTION;
CREATE TABLE [ContactNotes] (
    [Id] int NOT NULL IDENTITY,
    [ContactId] int NOT NULL,
    [UserId] int NOT NULL,
    [Content] nvarchar(4000) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_ContactNotes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ContactNotes_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ContactNotes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [ContactTagAssignments] (
    [ContactId] int NOT NULL,
    [TagId] int NOT NULL,
    [AssignedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ContactTagAssignments] PRIMARY KEY ([ContactId], [TagId]),
    CONSTRAINT [FK_ContactTagAssignments_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ContactTagAssignments_OrganizationTags_TagId] FOREIGN KEY ([TagId]) REFERENCES [OrganizationTags] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_ContactNotes_ContactId_CreatedAt] ON [ContactNotes] ([ContactId], [CreatedAt]);

CREATE INDEX [IX_ContactNotes_UserId] ON [ContactNotes] ([UserId]);

CREATE INDEX [IX_ContactTagAssignments_TagId] ON [ContactTagAssignments] ([TagId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260913074647_AddPeopleContactsCRM', N'10.0.11');

COMMIT;
GO

