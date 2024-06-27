import { normalizePath, Vault } from 'obsidian';
import { join, parse } from 'path';

export class JsonFileManager {
  private vault: Vault;
  private pluginDir: string;

  constructor(vault: Vault, pluginId: string) {
    this.vault = vault;
    this.pluginDir = normalizePath(join('.obsidian', 'plugins', pluginId));
  }

  private getFullPath(relativePath: string): string {
    return normalizePath(join(this.pluginDir, relativePath));
  }

  /**
   * Read data from a JSON file.
   * @param relativePath The path to the JSON file, relative to the plugin directory.
   * @returns The parsed JSON data.
   */
  public async readJsonFile(relativePath: string): Promise<any> {
    const fullPath = this.getFullPath(relativePath);
    const content = await this.vault.adapter.read(fullPath);
    return JSON.parse(content);
  }

  /**
   * Write data to a JSON file.
   * @param relativePath The path to the JSON file, relative to the plugin directory.
   * @param data The data to write.
   */
  public async writeJsonFile(relativePath: string, data: any): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    const existingData = await this.vault.adapter.read(relativePath);
    const existingJsonData = JSON.parse(existingData);
    const newData = JSON.stringify({ ...existingJsonData, ...data });
    await this.vault.adapter.append(fullPath, newData);
  }

  /**
   * Create a new JSON file.
   * @param relativePath The path to the new JSON file, relative to the plugin directory
   * @param initialData Optional initial data for the file.
   */
  public async createJsonFile(
    relativePath: string,
    initialData: any = {},
  ): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    const jsonString = JSON.stringify(initialData);
    await this.createDirectory(fullPath);
    await this.vault.adapter.write(fullPath, jsonString);
  }

  /**
   * Delete a JSON file.
   * @param relativePath The path to the JSON file to delete, relative to the plugin directory
   */
  public async deleteJsonFile(relativePath: string): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    await this.vault.adapter.trashLocal(fullPath);
  }

  /**
   * Check if a file or directory exists.
   * @param relativePath The path to the file or directory, relative to the plugin directory.
   * @returns True if the file or directory exists, false otherwise.
   */
  public async exists(relativePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(relativePath);
    const file = await this.vault.adapter.exists(fullPath);
    return file;
  }

  /**
   * Read all JSON files in a directory.
   * @param relativeDirPath The path to the directory, relative to the plugin directory.
   * @returns An object where keys are file names and values are parsed JSON contents.
   */
  public async readAllJsonFilesInDirectory(
    relativeDirPath: string,
  ): Promise<Record<string, any>> {
    const fullDirPath = this.getFullPath(relativeDirPath);
    const listedItems = await this.vault.adapter.list(fullDirPath);

    const result: Record<string, any> = {};

    await Promise.all(
      listedItems.files.map(async (filePath) => {
        if (!filePath.endsWith('json')) {
          return;
        }

        const fileName = this.extractFileName(filePath);

        const content = await this.vault.adapter.read(filePath);
        result[fileName] = JSON.parse(content);
      }),
    );

    return result;
  }

  /**
   * Create directory if it doesn't exist.
   * @param relativeDirPath The path to the directory, relative to the plugin directory.
   */
  public async createDirectory(relativeDirPath: string): Promise<void> {
    const fullDirPath = this.getFullPath(relativeDirPath);
    const doesFolderExist = await this.vault.adapter.exists(fullDirPath);
    if (!doesFolderExist) {
      await this.vault.createFolder(fullDirPath);
    }
  }

  private extractFileName(filePath: string): string {
    return parse(filePath).name;
  }
}
