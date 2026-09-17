#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const gradlePropertiesPath = path.join(
  __dirname,
  '..',
  'android',
  'gradle.properties'
);

if (fs.existsSync(gradlePropertiesPath)) {
  let content = fs.readFileSync(gradlePropertiesPath, 'utf8');
  const original = content;

  if (!content.includes('android.builtInKotlin')) {
    content += '\nandroid.builtInKotlin=false\n';
  }

  if (!content.includes('android.newDsl')) {
    content += '\nandroid.newDsl=false\n';
  }

  if (content !== original) {
    fs.writeFileSync(gradlePropertiesPath, content, 'utf8');
    console.log('Patched android/gradle.properties');
  }
}
