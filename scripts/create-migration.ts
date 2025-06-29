import { execSync } from 'child_process';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Missing migration name. Usage: npm run migration:create <MigrationName>');
  process.exit(1);
}

const outputPath = `src/database/migrations/${migrationName}`;

const command = `ts-node ./node_modules/typeorm/cli.js migration:create ${outputPath} --outputJs`;

console.log(`📄 Creating JS migration: ${migrationName}`);
execSync(command, { stdio: 'inherit' });
