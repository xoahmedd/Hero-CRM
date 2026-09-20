SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.Projects', 'TeamId') IS NULL
BEGIN
    ALTER TABLE dbo.Projects ADD TeamId int NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Projects')
      AND name = N'IX_Projects_TeamId'
)
BEGIN
    CREATE INDEX IX_Projects_TeamId ON dbo.Projects(TeamId);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID(N'dbo.Projects')
      AND name = N'FK_Projects_Teams_TeamId'
)
BEGIN
    ALTER TABLE dbo.Projects WITH CHECK
    ADD CONSTRAINT FK_Projects_Teams_TeamId
        FOREIGN KEY (TeamId)
        REFERENCES dbo.Teams(Id)
        ON DELETE SET NULL;

    ALTER TABLE dbo.Projects
    CHECK CONSTRAINT FK_Projects_Teams_TeamId;
END;

COMMIT TRANSACTION;
