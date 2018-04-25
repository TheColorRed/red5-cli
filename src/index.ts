#!/usr/bin/env node
import * as cmdArgs from 'command-line-args'
import { OptionDefinition } from 'command-line-args'
process.argv.push('--color')
import chalk from 'chalk'
import * as path from 'path'
import * as cp from 'child_process'
import { makeNewProject, CreateOptions } from './create'
import { serve } from './serve';

export const error = chalk.bold.red
export const warning = chalk.bold.yellow
export const info = chalk.bold.cyan

const mainDefinitions: OptionDefinition[] = [
  { name: 'command', defaultOption: true },
  { name: 'version', alias: 'v', defaultValue: '1' }
]

interface Option {
  name: Options
  description: string
}

enum Options {
  New = 'new', Serve = 'serve',
  Make = 'make',
  Help = 'help'
}

let options: Option[] = [
  { name: Options.New, description: 'Creates a new project' },
  { name: Options.Make, description: `Makes a new item ${warning('(Not yet implemented)')}` },
  { name: Options.Serve, description: 'Serves the current project' },
]

const mainOptions = cmdArgs(mainDefinitions, { stopAtFirstUnknown: true } as any)
let argv = mainOptions._unknown || []
if (mainOptions.version === null) {
  try {
    let json = require(path.join(process.cwd(), 'node_modules/red5/package.json'))
    console.log(json.version)
  } catch (e) {
    console.log(error('This is not a working red5 application'))
  }
} else {
  try {
    switch (mainOptions.command) {
      case Options.New:
        const createDefinitions: OptionDefinition[] = [
          { name: 'project', defaultOption: true },
          { name: 'type', defaultValue: 'typescript', type: String }
        ]
        const createOptions: CreateOptions = cmdArgs(createDefinitions, { argv, stopAtFirstUnknown: true } as any)
        argv = mainOptions._unknown || []
        makeNewProject(createOptions)
        break
      case Options.Serve:
        serve()
        break
      case Options.Make:
        console.log(warning('Not yet implemented'))
        break
      case Options.Help:
        let longest = options.reduce<number>((s, v) => v.name.length > s ? v.name.length : s, 0)
        for (let opt of options) {
          console.log(''.padStart(2) + `${opt.name}`.padEnd(longest + 4) + `${opt.description}`)
        }
        break
      default:
        console.log(error('Missing command'))
        console.log('  red5 <command> [options]')
        console.log('  -- Run "red5 help" for help')
        break
    }
  } catch (e) {
    console.log(error(e.message))
  }
}
