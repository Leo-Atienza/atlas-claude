#!/usr/bin/env node

/**
 * create-atlas-env — Scaffold ATLAS into ~/.claude/
 * Zero dependencies. Uses Node builtins only.
 *
 * Usage:
 *   npx create-atlas-env          # interactive
 *   npx create-atlas-env --full   # skip prompts, full install
 *   npx create-atlas-env --minimal # skip prompts, minimal install
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');

// ─── Banner ──────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log('    ╔═══════════════════════════════════════════╗');
  console.log('    ║              A T L A S                    ║');
  console.log('    ║  Autonomous Task, Learning & Agent System ║');
  console.log('    ╚═══════════════════════════════════════════╝');
  console.log('');
}

// ─── File operations ─────────────────────────────────────────

let created = 0;
let skipped = 0;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyIfMissing(src, dst) {
  const name = path.basename(dst);
  if (fs.existsSync(dst)) {
    console.log(`  ~ ${name} (exists, skipped)`);
    skipped++;
  } else {
    fs.copyFileSync(src, dst);
    console.log(`  + ${name}`);
    created++;
  }
}

/**
 * Copy all files from a source directory to a destination directory.
 * Non-recursive — only copies files at the top level.
 */
function copyDirFiles(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(dstDir);
  for (const file of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, file);
    if (fs.statSync(srcPath).isFile()) {
      copyIfMissing(srcPath, path.join(dstDir, file));
    }
  }
}

// ─── Interactive prompt ──────────────────────────────────────

function ask(question, defaultAnswer) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} [${defaultAnswer}] `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultAnswer);
    });
  });
}

// ─── Install logic ───────────────────────────────────────────

function installCore() {
  console.log('Creating directories...');
  for (const dir of [
    'hooks', 'scripts', 'rules', 'logs', 'sessions',
    'skills/self-evolve/templates', 'skills/smart-swarm',
  ]) {
    ensureDir(path.join(CLAUDE_DIR, dir));
  }
  console.log('');

  console.log('Installing hooks...');
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'hooks'),
    path.join(CLAUDE_DIR, 'hooks')
  );

  console.log('');
  console.log('Installing rules...');
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'rules'),
    path.join(CLAUDE_DIR, 'rules')
  );

  console.log('');
  console.log('Installing scripts...');
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'scripts'),
    path.join(CLAUDE_DIR, 'scripts')
  );

  console.log('');
  console.log('Installing core skills...');
  ensureDir(path.join(CLAUDE_DIR, 'skills', 'self-evolve', 'templates'));
  ensureDir(path.join(CLAUDE_DIR, 'skills', 'smart-swarm'));
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'skills', 'self-evolve', 'SKILL.md'),
    path.join(CLAUDE_DIR, 'skills', 'self-evolve', 'SKILL.md')
  );
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'skills', 'self-evolve', 'templates', 'skill-template.md'),
    path.join(CLAUDE_DIR, 'skills', 'self-evolve', 'templates', 'skill-template.md')
  );
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'skills', 'smart-swarm', 'SKILL.md'),
    path.join(CLAUDE_DIR, 'skills', 'smart-swarm', 'SKILL.md')
  );

  console.log('');
  console.log('Installing config...');
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'CLAUDE.md'),
    path.join(CLAUDE_DIR, 'CLAUDE.md')
  );
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'settings.json'),
    path.join(CLAUDE_DIR, 'settings.json')
  );
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'SYSTEM_CHANGELOG.md'),
    path.join(CLAUDE_DIR, 'SYSTEM_CHANGELOG.md')
  );
}

function installFull() {
  // Additional directories
  for (const dir of [
    'commands/flow', 'agents', 'scheduled-tasks',
    'skills/project-init', 'skills/flow/references',
  ]) {
    ensureDir(path.join(CLAUDE_DIR, dir));
  }

  console.log('');
  console.log('Installing commands...');
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'commands'),
    path.join(CLAUDE_DIR, 'commands')
  );
  // Flow subcommands
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'commands', 'flow'),
    path.join(CLAUDE_DIR, 'commands', 'flow')
  );

  console.log('');
  console.log('Installing agents...');
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'agents'),
    path.join(CLAUDE_DIR, 'agents')
  );

  console.log('');
  console.log('Installing additional skills...');
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'skills', 'project-init', 'SKILL.md'),
    path.join(CLAUDE_DIR, 'skills', 'project-init', 'SKILL.md')
  );
  copyIfMissing(
    path.join(EXAMPLES_DIR, 'skills', 'archived-skills-manifest.json'),
    path.join(CLAUDE_DIR, 'skills', 'archived-skills-manifest.json')
  );
  // Flow skill references
  copyDirFiles(
    path.join(EXAMPLES_DIR, 'skills', 'flow', 'references'),
    path.join(CLAUDE_DIR, 'skills', 'flow', 'references')
  );

  console.log('');
  console.log('Installing scheduled tasks...');
  const tasksDir = path.join(EXAMPLES_DIR, 'scheduled-tasks');
  if (fs.existsSync(tasksDir)) {
    for (const taskName of fs.readdirSync(tasksDir)) {
      const taskSrc = path.join(tasksDir, taskName);
      if (fs.statSync(taskSrc).isDirectory()) {
        const taskDst = path.join(CLAUDE_DIR, 'scheduled-tasks', taskName);
        ensureDir(taskDst);
        const skillSrc = path.join(taskSrc, 'SKILL.md');
        if (fs.existsSync(skillSrc)) {
          copyIfMissing(skillSrc, path.join(taskDst, 'SKILL.md'));
        }
      }
    }
  }
}

function initRuntimeFiles() {
  console.log('');
  console.log('Initializing runtime files...');
  const logsDir = path.join(CLAUDE_DIR, 'logs');
  ensureDir(logsDir);

  const failuresPath = path.join(logsDir, 'failures.jsonl');
  if (!fs.existsSync(failuresPath)) {
    fs.writeFileSync(failuresPath, '');
    console.log('  + failures.jsonl');
  }

  const errorsPath = path.join(logsDir, 'error-patterns.json');
  if (!fs.existsSync(errorsPath)) {
    fs.writeFileSync(errorsPath, '{}');
    console.log('  + error-patterns.json');
  }
}

function printNextSteps() {
  console.log('');
  console.log('=== ATLAS Installation Complete ===');
  console.log('');
  console.log(`Installed to: ${CLAUDE_DIR}`);
  console.log(`  ${created} files created, ${skipped} files skipped (already existed)`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review ~/.claude/CLAUDE.md and customize for your workflow');
  console.log('  2. Review ~/.claude/settings.json and adjust hooks/permissions');
  console.log('  3. Run: bash ~/.claude/scripts/smoke-test.sh');
  console.log('  4. Start Claude Code — ATLAS takes over from there');
  console.log('');
  console.log('Docs: https://github.com/leoatienza/atlas-claude');
  console.log('');
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  printBanner();

  // Check examples directory exists (verifies npm package integrity)
  if (!fs.existsSync(EXAMPLES_DIR)) {
    console.error('Error: examples/ directory not found. Package may be corrupted.');
    console.error(`Expected at: ${EXAMPLES_DIR}`);
    process.exit(1);
  }

  // Parse CLI flags
  const args = process.argv.slice(2);
  let mode;

  if (args.includes('--full') || args.includes('-f')) {
    mode = 'full';
  } else if (args.includes('--minimal') || args.includes('-m')) {
    mode = 'minimal';
  }

  // Interactive prompt if no flag provided
  if (!mode) {
    console.log('Install modes:');
    console.log('  full    — hooks, rules, scripts, commands, skills, agents, scheduled tasks');
    console.log('  minimal — hooks, rules, scripts, config only');
    console.log('');
    const answer = await ask('Install mode? (full/minimal)', 'full');
    mode = answer.toLowerCase().startsWith('m') ? 'minimal' : 'full';
  }

  console.log(`\nInstalling ATLAS (${mode} mode)...\n`);

  // Core install (both modes)
  installCore();

  // Full mode extras
  if (mode === 'full') {
    installFull();
  }

  // Runtime files (both modes)
  initRuntimeFiles();

  // Done
  printNextSteps();
}

main().catch((err) => {
  console.error('Installation failed:', err.message);
  process.exit(1);
});
