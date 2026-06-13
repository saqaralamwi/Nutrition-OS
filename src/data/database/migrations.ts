import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 6,
      steps: [
        createTable({
          name: 'audit_logs',
          columns: [
            { name: 'action_type', type: 'string' },
            { name: 'details', type: 'string' },
            { name: 'user_id', type: 'string' },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'patients',
          columns: [
            { name: 'incomplete_sections', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
