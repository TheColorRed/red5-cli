import * as path from 'path'
import * as fs from 'fs'
import * as cp from 'child_process'
import { info } from '..'
import * as watch from 'watch'

let maxRestarts = 5
let restarts = 0
let main = ''
let root = ''
let app: cp.ChildProcess

export function serve() {
  let pkg = require(path.join(process.cwd(), './package.json'))
  main = pkg.main || ''
  let stat = fs.statSync(path.join(process.cwd(), main))
  if (stat.isFile()) root = path.parse(path.join(process.cwd(), main)).dir
  else root = path.join(process.cwd(), main)
  if (main.length == 0) throw new Error('project.json requires a "main" property')
  watchApp()
}

function watchApp() {
  console.log(info(`Watching "${root}" for file changes`))
  watch.watchTree(root, { interval: 1 }, (files) => {
    startApp(true)
  })
}

function startApp(manualRestart = false) {
  if (manualRestart) {
    if (!app) {
      startApp()
      return
    }
    console.log(info('File change detected restarting app...'))
    app.kill()
    return
  }
  app = cp.spawn('node', [main, '--color'], { cwd: process.cwd() })
  console.log(info(`Worker process: ${app.pid}`))
  app.on('exit', () => {
    if (manualRestart) {
      restarts = 0
      return
    }
    restarts++
    if (restarts < maxRestarts) startApp()
    else restarts = 0
  })
  app.stderr.on('data', (data) => console.log(data.toString()))
  app.stdout.on('data', (data) => console.log(data.toString()))
}