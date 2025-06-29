import { execSync } from 'child_process';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Missing migration name. Usage: npm run migration:generate <MigrationName>');
  process.exit(1);
}

const outputPath = `src/database/migrations/${migrationName}`;

const command = `ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate ${outputPath} -d ./src/database/data-source.ts --outputJs`;

console.log(`📦 Generating JS migration: ${migrationName}`);
execSync(command, { stdio: 'inherit' });
