SELECT
    c.name AS ColumnName,
    TYPE_NAME(c.user_type_id) AS DataType,
    c.is_nullable
FROM sys.columns c
WHERE c.object_id = OBJECT_ID(N'dbo.Projects')
  AND c.name = N'TeamId';

SELECT name AS IndexName
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.Projects')
  AND name = N'IX_Projects_TeamId';

SELECT
    fk.name AS ForeignKeyName,
    fk.delete_referential_action_desc AS OnDelete
FROM sys.foreign_keys fk
WHERE fk.parent_object_id = OBJECT_ID(N'dbo.Projects')
  AND fk.name = N'FK_Projects_Teams_TeamId';

SELECT TOP (20)
    Id,
    Name,
    TeamId
FROM dbo.Projects
ORDER BY Id DESC;
