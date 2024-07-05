import { normalizePath, type Vault } from 'obsidian';

export class JsonFileManager {
  private vault: Vault;
  private pluginDir: string;

  constructor(vault: Vault, pluginId: string) {
    this.vault = vault;
    this.pluginDir = normalizePath(`.obsidian/plugins/${pluginId}`);
  }

  private getFullPath(relativePath: string): string {
    return normalizePath(`${this.pluginDir}/${relativePath}`);
  }

  /**
   * Read data from a JSON file.
   * @param relativePath The path to the JSON file, relative to the plugin directory.
   * @returns The parsed JSON data.
   */
  public async readJsonFile<T extends object>(
    relativePath: string,
  ): Promise<T> {
    const fullPath = this.getFullPath(relativePath);
    const content = await this.vault.adapter.read(fullPath);
    return JSON.parse(content);
  }

  /**
   * Write data to a JSON file.
   * @param relativePath The path to the JSON file, relative to the plugin directory.
   * @param data The data to write.
   */
  public async writeJsonFile<T extends object>(
    relativePath: string,
    data: T,
  ): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    await this.vault.adapter.write(fullPath, JSON.stringify(data));
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
}
