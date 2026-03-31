const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const { diffContracts, analyzeStorage } = require('./diff');

const program = new Command();

program
  .name('contract-diff')
  .description('Smart contract diff analyzer')
  .version('1.0.0');

program
  .command('diff <oldFile> <newFile>')
  .description('Compare two contract files')
  .option('-o, --output <file>', 'Save report to file')
  .action(async (oldFile, newFile, options) => {
    try {
      const oldPath = path.resolve(oldFile);
      const newPath = path.resolve(newFile);

      console.log(chalk.cyan('\n🔍 Analyzing contract changes...\n'));
      console.log(`Old: ${oldFile}`);
      console.log(`New: ${newFile}\n`);

      const result = await diffContracts(oldPath, newPath);

      // Display summary
      console.log(chalk.bold('📊 Summary\n'));
      console.log(`Functions: ${result.functions.added.length} added, ${result.functions.modified.length} modified, ${result.functions.removed.length} removed`);
      console.log(`Events: ${result.events.added.length} added, ${result.events.removed.length} removed`);
      console.log(`Storage: ${result.storageChanges.length} changes\n`);

      // Functions
      if (result.functions.added.length > 0) {
        console.log(chalk.green('Functions Added:'));
        result.functions.added.forEach(fn => console.log(`  + ${fn}`));
        console.log();
      }

      if (result.functions.removed.length > 0) {
        console.log(chalk.red('Functions Removed:'));
        result.functions.removed.forEach(fn => console.log(`  - ${fn}`));
        console.log();
      }

      if (result.functions.modified.length > 0) {
        console.log(chalk.yellow('Functions Modified:'));
        result.functions.modified.forEach(fn => console.log(`  ~ ${fn.name}`));
        console.log();
      }

      // Storage warnings
      if (result.storageChanges.length > 0) {
        console.log(chalk.red.bold('⚠️  Storage Layout Changes Detected!\n'));
        result.storageChanges.forEach(change => {
          console.log(chalk.red(`  ${change.variable}: ${change.oldType} → ${change.newType}`));
        });
        console.log(chalk.red('\n  WARNING: Storage changes can break upgrades!\n'));
      }

      // Save report
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(result, null, 2));
        console.log(chalk.green(`✅ Report saved to ${options.output}\n`));
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('storage <oldFile> <newFile>')
  .description('Check only storage layout changes')
  .action(async (oldFile, newFile) => {
    try {
      const changes = await analyzeStorage(oldFile, newFile);
      
      console.log(chalk.cyan('\n📦 Storage Layout Analysis\n'));
      
      if (changes.length === 0) {
        console.log(chalk.green('✅ No storage changes detected\n'));
        return;
      }

      console.log(chalk.red(`⚠️  ${changes.length} storage changes found:\n`));
      changes.forEach(change => {
        console.log(`  ${chalk.yellow(change.slot)}: ${change.variable}`);
        console.log(`    ${change.oldType || 'none'} → ${change.newType || 'none'}`);
      });
      console.log();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

program.parse();
