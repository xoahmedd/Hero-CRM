BEGIN TRANSACTION;
IF EXISTS (SELECT 1 FROM [TaskItems] WHERE [ProjectId] IS NULL) THROW 50001, 'Cannot rollback MakeTaskProjectOptional while standalone tasks exist.', 1;

ALTER TABLE [TaskItems] DROP CONSTRAINT [FK_TaskItems_Projects_ProjectId];

DROP INDEX [IX_TaskItems_ProjectId] ON [TaskItems];
DECLARE @var nvarchar(max);
SELECT @var = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TaskItems]') AND [c].[name] = N'ProjectId');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [TaskItems] DROP CONSTRAINT ' + @var + ';');
ALTER TABLE [TaskItems] ALTER COLUMN [ProjectId] int NOT NULL;
CREATE INDEX [IX_TaskItems_ProjectId] ON [TaskItems] ([ProjectId]);

ALTER TABLE [TaskItems] ADD CONSTRAINT [FK_TaskItems_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE;

DELETE FROM [__EFMigrationsHistory]
WHERE [MigrationId] = N'20260914120000_MakeTaskProjectOptional';

COMMIT;
GO

