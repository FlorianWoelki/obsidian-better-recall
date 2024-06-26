# Obsidian Better Recall

*WIP*

## Development

To customize this project for your needs, you can clone it and then install all dependencies:
```sh
$ git clone https://github.com/FlorianWoelki/obsidian-better-recall
$ cd obsidian-better-recall
$ yarn
```

After the installation, you need to create a `env.mjs` file in the root directory. Fill the file with the following content:

```js
export const obsidianExportPath =
  '<path-to-obsidian-vault>/.obsidian/plugins/obsidian-better-recall';
```

Afterward, you can start the rollup dev server by using:

```sh
$ pnpm dev
```

This command will automatically build the necessary files for testing and developing every change. Furthermore, it copies all the essential files to the specified plugin directory.

Finally, you can customize the plugin and add it to your plugins.
