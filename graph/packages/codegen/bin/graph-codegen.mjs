#!/usr/bin/env node

import { spawnSync } from 'child_process'
import figlet from 'figlet'
import { readFileSync } from 'fs'
import meow from 'meow'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const configPath = resolve(__dirname, '../codegen-project.template.yml')
const schemaPath = resolve(__dirname, '../generated/graphql.schema.json')
const schemaAdminPath = resolve(__dirname, '../generated/admin/graphql.schema.json')

const DEFAULT_PROJECT_SRC_ROOT = 'src'
const DEFAULT_PROJECT_OUTPUT_DIR = 'graph'
const DEFAULT_CWD = process.cwd()
const HEADER_ART = figlet.textSync('Narrator Graph')

const cli = meow(
  `
${HEADER_ART}

    Usage
      $ narrator-graph-codegen
 
    Options
      --ref         Get the current migration id
      --silent, -s  Silence output
      --watch, -w   Watch files
      --root, -r    Project root (default: "${DEFAULT_PROJECT_SRC_ROOT}")
      --dir, -d     Project codegen output directory (default: "${DEFAULT_PROJECT_OUTPUT_DIR}")
      --admin       Use the admin schema (default is the user schema,
                    this flag should only be used for trusted backend services)
      --cwd         Working directory (default: "${DEFAULT_CWD}")
 
`,
  {
    importMeta: import.meta,
    flags: {
      ref: {
        type: 'boolean',
      },
      admin: {
        type: 'boolean',
      },
      watch: {
        type: 'boolean',
        shortFlag: 'w',
      },
      root: {
        type: 'string',
        shortFlag: 'r',
        default: DEFAULT_PROJECT_SRC_ROOT,
      },
      dir: {
        type: 'string',
        shortFlag: 'd',
        default: DEFAULT_PROJECT_OUTPUT_DIR,
      },
      cwd: {
        type: 'string',
        default: DEFAULT_CWD,
      },
    },
  }
)

function getRef() {
  return readFileSync(resolve(__dirname, '../REF'), 'utf-8')
}

function run(flags) {
  if (flags.ref) {
    console.log(getRef())
    return
  }

  let codegenArgs = ['--silent', 'graphql-codegen', 'graphql-codegen', '--config', configPath]
  if (flags.watch) {
    codegenArgs = codegenArgs.concat('--watch')
  }

  /**
   * These are passed into the codegen project's template
   *   SCHEMA_PATH        Where to output
   *   PROJECT_SRC_ROOT   Where the project is
   *   PROJECT_OUTPUT_DIR Path to output to relative to project root
   */
  const env = {
    SCHEMA_PATH: flags.admin ? schemaAdminPath : schemaPath,
    PROJECT_SRC_ROOT: flags.root,
    PROECT_OUTPUT_DIR: flags.dir,

    // Allow env var overrides
    ...process.env,
  }

  console.log(HEADER_ART)
  spawnSync('yarn run', codegenArgs, {
    stdio: 'inherit',
    cwd: flags.cwd,
    env,
  })
}

run(cli.flags)
