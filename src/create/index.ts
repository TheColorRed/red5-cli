import * as cmdArgs from 'command-line-args'
import { OptionDefinition } from 'command-line-args'
import * as glob from 'glob'
import * as fs from 'fs'
import * as path from 'path'
import * as cp from 'child_process'
import { error, info } from '..';

const copyDir = require('copy-dir')

export interface CreateOptions {
  project: string
  type: 'typescript' | 'javascript'
}

let project = ''
let type: 'typescript' | 'javascript' = 'typescript'
let projectDir = ''
let cwd = ''

export function makeNewProject(createOptions: CreateOptions) {
  project = createOptions.project
  type = createOptions.type
  type = ['javascript', 'typescript'].includes(type) ? type : 'typescript'
  cwd = process.cwd()
  projectDir = path.join(cwd, project)
  fs.stat(projectDir, (err, stats) => {
    if (err) {
      // Could not find the directory, lets create a new one
      return makeProject()
    }
    if (process.platform == 'win32') {
      // Windows does not allow for files and directories to be named the same
      if (stats.isDirectory() || stats.isFile()) {
        // The stats of the path is a directory, we can't overwrite it
        return console.log(error(`The project "${project}" already exists, delete the directory and run the command again`))
      } else {
        return makeProject()
      }
    } else {
      if (stats.isDirectory()) {
        // The stats of the path is a directory, we can't overwrite it
        return console.log(error(`The project "${project}" already exists, delete the directory and run the command again`))
      } else {
        // The stats of the path is a file, we can make a new project
        return makeProject()
      }
    }
  })
}

async function makeProject() {
  console.log(info(`Creating project at: ${projectDir}`))
  fs.mkdirSync(projectDir)

  console.log(info(`Copying the ${type} boilerplate files...`))
  let root = path.join(__dirname, '../../boilerplate')
  copyDir.sync(path.join(__dirname, '../../boilerplate/typescript'), projectDir)
  if (type == 'javascript') {
    try {
      cp.execSync('tsc -p . || rm -rf src && rm tsconfig.json', { cwd: projectDir })
    } catch (e) { }
  }
  await copyFile(path.join(root, 'package.json'), path.join(projectDir, 'package.json'))

  console.log(info('Installing the required node modules...'))
  updateProjectName()
  let npmInstall = cp.exec('npm install --color always', { cwd: projectDir })
  npmInstall.stdout.on('data', (data) => console.log(data))
  npmInstall.stderr.on('data', (data) => console.log(data))
  npmInstall.on('exit', () => {
    if (type == 'typescript') {
      console.log(info('Compiling TypeScript files...'))
      let tsc = cp.exec('tsc -p . --pretty', { cwd: projectDir })
      tsc.stdout.on('data', (data) => console.log(data))
      tsc.stderr.on('data', (data) => console.log(data))
    }
  })
}

function updateProjectName() {
  let pkg = path.join(projectDir, 'package.json')
  let json = require(pkg)
  json.name = project.toLowerCase()
  fs.writeFileSync(pkg, JSON.stringify(json, null, 2))
}

async function copyFile(from: string, to: string) {
  return new Promise(resolve => {
    fs.createReadStream(from)
      .pipe(fs.createWriteStream(to))
      .on('close', () => resolve())
  })
}
