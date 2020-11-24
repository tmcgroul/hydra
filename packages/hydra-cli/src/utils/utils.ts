import * as fs from 'fs-extra'
import * as path from 'path'
import Debug from 'debug'

const debug = Debug('hydra-cli:utils')

export function createDir(path: string, del = false, recursive = false): void {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive })
  }
  if (del) {
    fs.removeSync(path)
    fs.mkdirSync(path)
  }
}

export function createFile(path: string, content = '', replace = false): void {
  if (!fs.existsSync(path) || replace) {
    fs.writeFileSync(path, content)
  }
}

export async function copyFiles(from: string, to: string): Promise<void> {
  try {
    await fs.copy(from, to)
  } catch (err) {
    console.error(err)
  }
}

export function getTemplatePath(template: string): string {
  const templatePath = path.resolve(
    __dirname,
    '..',
    'templates',
    ...template.split('/')
  )
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Tempate ${template} does not exists!`)
  }
  return templatePath
}

/**
 * Copies the template to the current directory of the process under the <filename>
 *
 * @param template Template file int templates/<templateName>
 * @param fileName Filename of the file to be created
 */
export async function copyTemplateToCWD(
  templateName: string,
  fileName: string
): Promise<void> {
  await fs.copyFile(
    getTemplatePath(templateName),
    path.join(process.cwd(), fileName)
  )
}

/**
 * resolve a package version by resolving package.json
 *
 * @param pkgName dependency to loockup
 */
export function resolvePackageVersion(pkgName: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkgJson = require(`${pkgName}/package.json`) as Record<string, unknown>
  debug(`Resolved: ${JSON.stringify(pkgJson)}`)
  if (!pkgJson.version) {
    throw new Error(
      `Can't resolve ${pkgName} version based on ${pkgName}/package.json`
    )
  }
  return pkgJson.version as string
}

/**
 * Tries to resolve a filepath from node_modules and reads the file as a string
 *
 * @param path a path like 'someModule/<path-to-file>
 */
export function readModuleFile(path: string): string {
  const resolved = require.resolve(path)
  return fs.readFileSync(resolved, 'utf-8')
}
