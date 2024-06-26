# Obsidian Better Recall

*WIP*

Things to do before release:
- [ ] Add [Anki algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)
- [ ] Add functionality of creating and recalling custom decks
- [ ] Add recall view
  - [ ] Add view for selecting decks
  - [ ] Add view for recalling notes
  - [ ] Use Anki algorithm to recall notes
- [ ] Add settings view for managing decks (including notes)
- [ ] Add settings view for customizing Anki algorithm parameters

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
