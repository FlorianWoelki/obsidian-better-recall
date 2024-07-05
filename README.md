# Obsidian Better Recall

![Preview Image](./docs/preview-image.png)

## What is it?

*WIP*

Things to do before release:
- [x] Add [Anki algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)
- [x] Add functionality of creating and recalling custom decks
- [x] Add cards via `Add Card Modal`
- [x] Add recall view
  - [x] Add empty view
  - [x] Add view for selecting decks
  - [x] Add view for managing decks
    - [x] Add deletion of cards
  - [x] Add view for recalling notes
  - [x] Use Anki algorithm to recall notes
- [x] Add create modal for creating decks
- [x] Add ribbon icon which opens the recall view
- [x] Add data integration
- [ ] Add settings view for customizing Anki algorithm parameters
- [x] Test and adapt to mobile experience

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
