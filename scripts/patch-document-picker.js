#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const docPickerJava = path.join(
  __dirname,
  '..',
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

if (fs.existsSync(docPickerJava)) {
  let content = fs.readFileSync(docPickerJava, 'utf8');
  const original = content;

  // Remove GuardedResultAsyncTask import (removed in RN 0.74+)
  content = content.replace(
    /import com\.facebook\.react\.bridge\.GuardedResultAsyncTask;\n/g,
    ''
  );

  // Replace GuardedResultAsyncTask extends with AsyncTask
  content = content.replace(
    /private static class ProcessDataTask extends GuardedResultAsyncTask<ReadableArray>/,
    'private static class ProcessDataTask extends AsyncTask<ReadableArray, Void, ReadableArray>'
  );

  // Remove super() call that takes ExceptionHandler
  content = content.replace(
    /super\(reactContext\.getExceptionHandler\(\);\n/g,
    ''
  );

  // Rename doInBackgroundGuarded to doInBackground
  content = content.replace(
    /protected ReadableArray doInBackgroundGuarded\(\)/,
    'protected ReadableArray doInBackground(ReadableArray... params)'
  );

  // Rename onPostExecuteGuarded to onPostExecute
  content = content.replace(
    /protected void onPostExecuteGuarded\(ReadableArray readableArray\)/,
    'protected void onPostExecute(ReadableArray readableArray)'
  );

  // Add AsyncTask import if not present
  if (!content.includes('import android.os.AsyncTask;')) {
    content = content.replace(
      'import android.os.Bundle;',
      'import android.os.AsyncTask;\nimport android.os.Bundle;'
    );
  }

  // Use executeOnExecutor instead of execute (deprecated on newer Android)
  content = content.replace(
    /\.execute\(\);/,
    '.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);'
  );

  if (content !== original) {
    fs.writeFileSync(docPickerJava, content, 'utf8');
    console.log('Patched react-native-document-picker RNDocumentPickerModule.java');
  }
}
