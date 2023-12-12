const fs = require('fs');
const path = require('path');

const baseTemplate = `name: Node.js CI

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '19.x'
      - run: yarn --frozen-lockfile
      - run: yarn test
      - run: yarn lint
      - run: yarn run build
`;

const generateFileTem = file => {
  const fileToJs = `${path.parse(file).name}.js`;
  const __GIST_ID__ = '2ca322ffbde25a80c39afb0c1e5cf731';
  const __TOKEN__ = '${{ secrets.TOKEN }}';
  const tpl = `
      - name: Deploy ${fileToJs}
        uses: exuanbo/actions-deploy-gist@v1
        with:
          TOKEN: ${__TOKEN__}
          gist_id: ${__GIST_ID__}
          file_path: ./build/src/${fileToJs}
  `;
  return tpl;
};
const selectFiles = () => {
  const filesFound = [];
  const excludeFiles = ['NetscriptDefinitions.d.ts', 'typings.d.ts'];
  const dirname = path.resolve(__dirname, '..', 'src');
  fs.readdirSync(dirname).forEach(file => {
    if (path.extname(file) === '.ts' && !excludeFiles.includes(file)) {
      filesFound.push(file);
    }
  });

  return filesFound;
};

const init = () => {
  const files = selectFiles();
  let tpl = baseTemplate;

  files.forEach(file => {
    const fileTpl = generateFileTem(file);
    tpl += fileTpl;
  });

  fs.writeFileSync(
    `${path.resolve(__dirname, '..', '.github', 'workflows')}/deploy-gist.yml`,
    tpl
  );
};

init();
