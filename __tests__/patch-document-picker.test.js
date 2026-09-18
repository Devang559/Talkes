const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

describe('patch-document-picker', () => {
  it('replaces the invalid AsyncTask constructor call', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-picker-patch-'));
    const scriptDir = path.join(tempDir, 'scripts');
    const filePath = path.join(
      tempDir,
      'node_modules',
      'react-native-document-picker',
      'android',
      'src',
      'main',
      'java',
      'com',
      'reactnativedocumentpicker',
      'RNDocumentPickerModule.java'
    );

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.mkdirSync(scriptDir, { recursive: true });

    const source = `public GetDocumentTask(ReactContext reactContext, Promise promise) {
    super(reactContext.getExceptionHandler());
    // ...
    }
`;

    fs.writeFileSync(filePath, source, 'utf8');
    fs.copyFileSync(
      path.join(__dirname, '..', 'scripts', 'patch-document-picker.js'),
      path.join(scriptDir, 'patch-document-picker.js')
    );

    execFileSync('node', [path.join(scriptDir, 'patch-document-picker.js')], {
      cwd: tempDir,
      stdio: 'pipe',
    });

    const patched = fs.readFileSync(filePath, 'utf8');
    expect(patched).toContain('super();');
    expect(patched).not.toContain('getExceptionHandler()');
  });
});
