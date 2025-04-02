import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const supportedExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.webp',
  '.mp3',
  '.wav',
  '.mp4',
  '.webm',
  '.woff',
  '.woff2',
  '.ttf',
  '.pdf',
  '.json',
  '.csv',
];

const hyphenPattern = /^[a-z0-9]+(-[a-z0-9]+)*\.[a-z]+$/;

export function activate(context: vscode.ExtensionContext) {
  const isResourceFile = (ext: string): boolean => {
    return supportedExtensions.includes(ext);
  };

  const checkFileName = (fileName: string): boolean => {
    return hyphenPattern.test(fileName);
  };

  const fixToHyphenCase = (filename: string) => {
    const ext = path.extname(filename);
    const name = path.basename(filename);
    const duplicateExt = new RegExp(`(${ext.replace('.', '\\.')})+$`, 'i');

    const fixedName = name
      .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to hyphen
      .toLowerCase()
      .replace(/[ _]+/g, '-') // replace space and underscore with hyphen
      .replace(/^-+|-+$/g, '') // remove start and end hyphen
      .replace(/-{2,}/g, '-') // remove multiple hyphen
      .replace(duplicateExt, ''); // Remove duplicated extensions like `.png.png.png`

    return `${fixedName}${ext.toLowerCase()}`;
  };

  const handleFileEvent = async (uri: vscode.Uri) => {
    const fileName = path.basename(uri.fsPath);

    if (!isResourceFile(path.extname(uri.fsPath))) {
      return;
    }

    if (!checkFileName(fileName)) {
      const choice = await vscode.window.showWarningMessage(`File "${fileName}" doesn't follow hyphen rules.`, 'Rename');

      if (choice === 'Rename') {
        const fixedName = fixToHyphenCase(uri.fsPath);
        const newPath = path.join(path.dirname(uri.fsPath), fixedName);

        fs.rename(uri.fsPath, newPath, (error) => {
          if (error) {
            vscode.window.showErrorMessage(`Failed to rename: ${error.message}`);
            console.error(`Failed to rename: ${error.message}`);
          } else {
            vscode.window.showInformationMessage(`Renamed to: ${fixedName}`);
            console.log(`Renamed to: ${fixedName}`);
          }
        });
      }
    }
  };

  vscode.workspace.onDidCreateFiles((event) => {
    event.files.forEach((file) => handleFileEvent(file));
  });

  vscode.workspace.onDidRenameFiles((event) => {
    event.files.forEach((file) => handleFileEvent(file.newUri));
  });
}

export function deactivate() {}
