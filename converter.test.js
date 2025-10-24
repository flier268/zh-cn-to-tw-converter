const { convert, shouldConvertFile, convertFilePath, isZipFile, processZipFile, processFolderPath } = require('./converter');
const AdmZip = require('adm-zip');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Converter Module', () => {
  describe('convert()', () => {
    test('should convert simplified Chinese to traditional Chinese', () => {
      const input = '你好世界';
      const output = convert(input);
      expect(output).toBe('你好世界'); // 這些字簡繁相同
    });

    test('should convert complex simplified Chinese text', () => {
      const input = '这是一个测试';
      const output = convert(input);
      expect(output).toBe('這是一個測試');
    });

    test('should preserve English text', () => {
      const input = 'Hello World';
      const output = convert(input);
      expect(output).toBe('Hello World');
    });

    test('should convert mixed Chinese and English', () => {
      const input = '这是 English 测试';
      const output = convert(input);
      expect(output).toBe('這是 English 測試');
    });

    test('should handle empty string', () => {
      const input = '';
      const output = convert(input);
      expect(output).toBe('');
    });

    test('should handle special characters and numbers', () => {
      const input = '测试123!@#$%';
      const output = convert(input);
      expect(output).toBe('測試123!@#$%');
    });
  });

  describe('shouldConvertFile()', () => {
    describe('SNBT files', () => {
      test('should convert .snbt files regardless of path', () => {
        expect(shouldConvertFile('config/test.snbt')).toBe(true);
        expect(shouldConvertFile('folder/subfolder/file.snbt')).toBe(true);
      });
    });

    describe('OpenLoader files', () => {
      test('should convert .json files in openloader directories', () => {
        expect(shouldConvertFile('openloader/resources/test.json')).toBe(true);
        expect(shouldConvertFile('config/openloader/data/file.json')).toBe(true);
      });

      test('should convert .lang files in openloader directories', () => {
        expect(shouldConvertFile('openloader/resources/test.lang')).toBe(true);
        expect(shouldConvertFile('config/openloader/data/file.lang')).toBe(true);
      });
    });

    describe('Chinese language files', () => {
      test('should convert zh_cn files', () => {
        expect(shouldConvertFile('assets/mod/lang/zh_cn.json')).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/zh_CN.json')).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/ZH_CN.lang')).toBe(true);
      });

      test('should convert zh-cn files', () => {
        expect(shouldConvertFile('assets/mod/lang/zh-cn.json')).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/zh-CN.json')).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/ZH-CN.lang')).toBe(true);
      });
    });

    describe('English language files with convertEnUs flag', () => {
      test('should convert en_us files when convertEnUs is true', () => {
        expect(shouldConvertFile('assets/mod/lang/en_us.json', true)).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/en_US.json', true)).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/EN_US.lang', true)).toBe(true);
      });

      test('should convert en-us files when convertEnUs is true', () => {
        expect(shouldConvertFile('assets/mod/lang/en-us.json', true)).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/en-US.json', true)).toBe(true);
        expect(shouldConvertFile('assets/mod/lang/EN-US.lang', true)).toBe(true);
      });

      test('should NOT convert en_us files when convertEnUs is false', () => {
        expect(shouldConvertFile('assets/mod/lang/en_us.json', false)).toBe(false);
        expect(shouldConvertFile('assets/mod/lang/en-US.json', false)).toBe(false);
      });
    });

    describe('Non-language files', () => {
      test('should NOT convert non-language files', () => {
        expect(shouldConvertFile('assets/mod/textures/test.png')).toBe(false);
        expect(shouldConvertFile('config/mod.cfg')).toBe(false);
        expect(shouldConvertFile('data/test.txt')).toBe(false);
        expect(shouldConvertFile('assets/mod/models/test.json')).toBe(false);
      });
    });
  });

  describe('convertFilePath()', () => {
    describe('zh_cn variations', () => {
      test('should convert zh_cn to zh_tw (lowercase)', () => {
        expect(convertFilePath('assets/mod/lang/zh_cn.json')).toBe('assets/mod/lang/zh_tw.json');
      });

      test('should convert zh_CN to zh_TW (mixed case)', () => {
        expect(convertFilePath('assets/mod/lang/zh_CN.json')).toBe('assets/mod/lang/zh_TW.json');
      });

      test('should convert ZH_CN to ZH_TW (uppercase)', () => {
        expect(convertFilePath('assets/mod/lang/ZH_CN.json')).toBe('assets/mod/lang/ZH_TW.json');
      });

      test('should convert Zh_Cn to Zh_Tw (title case)', () => {
        expect(convertFilePath('assets/mod/lang/Zh_Cn.json')).toBe('assets/mod/lang/Zh_Tw.json');
      });
    });

    describe('zh-cn variations', () => {
      test('should convert zh-cn to zh-tw (lowercase)', () => {
        expect(convertFilePath('assets/mod/lang/zh-cn.json')).toBe('assets/mod/lang/zh-tw.json');
      });

      test('should convert zh-CN to zh-TW (mixed case)', () => {
        expect(convertFilePath('assets/mod/lang/zh-CN.json')).toBe('assets/mod/lang/zh-TW.json');
      });

      test('should convert ZH-CN to ZH-TW (uppercase)', () => {
        expect(convertFilePath('assets/mod/lang/ZH-CN.json')).toBe('assets/mod/lang/ZH-TW.json');
      });

      test('should convert Zh-Cn to Zh-Tw (title case)', () => {
        expect(convertFilePath('assets/mod/lang/Zh-Cn.json')).toBe('assets/mod/lang/Zh-Tw.json');
      });
    });

    describe('en_us variations', () => {
      test('should convert en_us to zh_tw (lowercase)', () => {
        expect(convertFilePath('assets/mod/lang/en_us.json')).toBe('assets/mod/lang/zh_tw.json');
      });

      test('should convert en_US to zh_TW (mixed case)', () => {
        expect(convertFilePath('assets/mod/lang/en_US.json')).toBe('assets/mod/lang/zh_TW.json');
      });

      test('should convert EN_US to ZH_TW (uppercase)', () => {
        expect(convertFilePath('assets/mod/lang/EN_US.json')).toBe('assets/mod/lang/ZH_TW.json');
      });

      test('should convert En_Us to Zh_Tw (title case)', () => {
        expect(convertFilePath('assets/mod/lang/En_Us.json')).toBe('assets/mod/lang/Zh_Tw.json');
      });
    });

    describe('en-us variations', () => {
      test('should convert en-us to zh-tw (lowercase)', () => {
        expect(convertFilePath('assets/mod/lang/en-us.json')).toBe('assets/mod/lang/zh-tw.json');
      });

      test('should convert en-US to zh-TW (mixed case)', () => {
        expect(convertFilePath('assets/mod/lang/en-US.json')).toBe('assets/mod/lang/zh-TW.json');
      });

      test('should convert EN-US to ZH-TW (uppercase)', () => {
        expect(convertFilePath('assets/mod/lang/EN-US.json')).toBe('assets/mod/lang/ZH-TW.json');
      });

      test('should convert En-Us to Zh-Tw (title case)', () => {
        expect(convertFilePath('assets/mod/lang/En-Us.json')).toBe('assets/mod/lang/Zh-Tw.json');
      });
    });

    describe('Complex paths', () => {
      test('should handle multiple conversions in path', () => {
        expect(convertFilePath('zh_cn/assets/mod/lang/zh_cn.json')).toBe('zh_tw/assets/mod/lang/zh_tw.json');
      });

      test('should preserve non-matching parts', () => {
        expect(convertFilePath('assets/minecraft/textures/test.png')).toBe('assets/minecraft/textures/test.png');
      });
    });
  });

  describe('isZipFile()', () => {
    test('should detect valid ZIP files', () => {
      // Create a simple ZIP file
      const zip = new AdmZip();
      zip.addFile('test.txt', Buffer.from('test', 'utf8'));
      const zipBuffer = zip.toBuffer();

      expect(isZipFile(zipBuffer)).toBe(true);
    });

    test('should reject non-ZIP files', () => {
      const textBuffer = Buffer.from('This is not a ZIP file', 'utf8');
      expect(isZipFile(textBuffer)).toBe(false);
    });

    test('should reject empty buffers', () => {
      const emptyBuffer = Buffer.alloc(0);
      expect(isZipFile(emptyBuffer)).toBe(false);
    });

    test('should reject buffers that are too short', () => {
      const shortBuffer = Buffer.from([0x50, 0x4B]); // Only "PK"
      expect(isZipFile(shortBuffer)).toBe(false);
    });

    test('should reject buffers with wrong magic bytes', () => {
      const wrongBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(isZipFile(wrongBuffer)).toBe(false);
    });
  });

  describe('processZipFile()', () => {
    let testDir;
    let inputZipPath;
    let outputZipPath;

    beforeEach(async () => {
      // Create temporary directory for tests
      testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'converter-test-'));
      inputZipPath = path.join(testDir, 'input.zip');
      outputZipPath = path.join(testDir, 'output.zip');
    });

    afterEach(async () => {
      // Clean up temporary directory
      await fs.rm(testDir, { recursive: true, force: true });
    });

    test('should process ZIP with zh_cn files', async () => {
      // Create test ZIP
      const zip = new AdmZip();
      zip.addFile('assets/mod/lang/zh_cn.json', Buffer.from('{"test": "测试"}', 'utf8'));
      zip.writeZip(inputZipPath);

      // Process ZIP
      const stats = await processZipFile(inputZipPath, outputZipPath, false);

      // Verify stats
      expect(stats.totalFiles).toBe(1);
      expect(stats.convertedFiles).toBe(1);
      expect(stats.skippedFiles).toBe(0);

      // Verify output
      const outputZip = new AdmZip(outputZipPath);
      const entries = outputZip.getEntries();
      const fileNames = entries.map(e => e.entryName);

      expect(fileNames).toContain('assets/mod/lang/zh_cn.json');
      expect(fileNames).toContain('assets/mod/lang/zh_tw.json');
    });

    test('should handle en_us files only when convertEnUs is true and no zh_cn exists', async () => {
      // Create test ZIP with only en_us
      const zip = new AdmZip();
      zip.addFile('assets/mod/lang/en_us.json', Buffer.from('{"test": "Hello"}', 'utf8'));
      zip.writeZip(inputZipPath);

      // Process ZIP with convertEnUs=true
      const stats = await processZipFile(inputZipPath, outputZipPath, true);

      // Verify stats
      expect(stats.totalFiles).toBe(1);
      expect(stats.convertedFiles).toBe(1);

      // Verify output - should have en_us with converted content
      const outputZip = new AdmZip(outputZipPath);
      const entries = outputZip.getEntries();
      const fileNames = entries.map(e => e.entryName);

      expect(fileNames).toContain('assets/mod/lang/en_us.json');
      expect(fileNames).not.toContain('assets/mod/lang/zh_tw.json');
    });

    test('should NOT convert en_us when zh_cn exists (even with convertEnUs=true)', async () => {
      // Create test ZIP with both zh_cn and en_us
      const zip = new AdmZip();
      zip.addFile('assets/mod/lang/zh_cn.json', Buffer.from('{"test": "测试"}', 'utf8'));
      zip.addFile('assets/mod/lang/en_us.json', Buffer.from('{"test": "Hello"}', 'utf8'));
      zip.writeZip(inputZipPath);

      // Process ZIP with convertEnUs=true
      const stats = await processZipFile(inputZipPath, outputZipPath, true);

      // Verify stats
      expect(stats.totalFiles).toBe(2);
      expect(stats.convertedFiles).toBe(1); // Only zh_cn
      expect(stats.skippedFiles).toBe(1); // en_us is skipped

      // Verify output
      const outputZip = new AdmZip(outputZipPath);
      const entries = outputZip.getEntries();
      const fileNames = entries.map(e => e.entryName);

      expect(fileNames).toContain('assets/mod/lang/zh_cn.json');
      expect(fileNames).toContain('assets/mod/lang/zh_tw.json');
      expect(fileNames).toContain('assets/mod/lang/en_us.json');

      // Verify en_us content is unchanged
      const enUsEntry = entries.find(e => e.entryName === 'assets/mod/lang/en_us.json');
      expect(enUsEntry.getData().toString('utf8')).toBe('{"test": "Hello"}');
    });

    test('should preserve case in file paths', async () => {
      // Create test ZIP with mixed case
      const zip = new AdmZip();
      zip.addFile('assets/mod/lang/zh_CN.json', Buffer.from('{"test": "测试"}', 'utf8'));
      zip.writeZip(inputZipPath);

      // Process ZIP
      await processZipFile(inputZipPath, outputZipPath, false);

      // Verify output preserves case
      const outputZip = new AdmZip(outputZipPath);
      const entries = outputZip.getEntries();
      const fileNames = entries.map(e => e.entryName);

      expect(fileNames).toContain('assets/mod/lang/zh_CN.json');
      expect(fileNames).toContain('assets/mod/lang/zh_TW.json');
    });

    test('should handle .snbt files', async () => {
      // Create test ZIP with .snbt file
      const zip = new AdmZip();
      zip.addFile('config/ftbquests/test.snbt', Buffer.from('测试内容', 'utf8'));
      zip.writeZip(inputZipPath);

      // Process ZIP
      const stats = await processZipFile(inputZipPath, outputZipPath, false);

      // Verify stats
      expect(stats.convertedFiles).toBe(1);
    });

    test('should skip non-language files', async () => {
      // Create test ZIP with non-language files
      const zip = new AdmZip();
      zip.addFile('assets/mod/textures/test.png', Buffer.from('PNG data', 'utf8'));
      zip.addFile('config/mod.cfg', Buffer.from('config data', 'utf8'));
      zip.writeZip(inputZipPath);

      // Process ZIP
      const stats = await processZipFile(inputZipPath, outputZipPath, false);

      // Verify all files are skipped
      expect(stats.convertedFiles).toBe(0);
      expect(stats.skippedFiles).toBe(2);
    });

    test('should process nested ZIP files', async () => {
      // Create inner ZIP with Chinese language file
      const innerZip = new AdmZip();
      innerZip.addFile('assets/mod/lang/zh_cn.json', Buffer.from('{"test": "测试"}', 'utf8'));
      const innerZipBuffer = innerZip.toBuffer();

      // Create outer ZIP containing the inner ZIP
      const outerZip = new AdmZip();
      outerZip.addFile('inner.zip', innerZipBuffer);
      outerZip.addFile('readme.txt', Buffer.from('This is a readme', 'utf8'));
      outerZip.writeZip(inputZipPath);

      // Process outer ZIP
      const stats = await processZipFile(inputZipPath, outputZipPath, false);

      // Verify stats - inner.zip should be converted
      expect(stats.convertedFiles).toBeGreaterThan(0);
      expect(stats.totalFiles).toBe(2);

      // Verify output ZIP contains processed inner.zip
      const outputZip = new AdmZip(outputZipPath);
      const entries = outputZip.getEntries();
      const innerZipEntry = entries.find(e => e.entryName === 'inner.zip');

      expect(innerZipEntry).toBeDefined();

      // Extract and verify the processed inner ZIP
      const processedInnerZip = new AdmZip(innerZipEntry.getData());
      const innerEntries = processedInnerZip.getEntries();
      const innerFileNames = innerEntries.map(e => e.entryName);

      // The processed inner ZIP should contain both zh_cn and zh_tw
      expect(innerFileNames).toContain('assets/mod/lang/zh_cn.json');
      expect(innerFileNames).toContain('assets/mod/lang/zh_tw.json');
    });

    test('should handle multiple levels of nested ZIPs', async () => {
      // Create innermost ZIP
      const innermost = new AdmZip();
      innermost.addFile('assets/mod/lang/zh_cn.json', Buffer.from('{"test": "测试"}', 'utf8'));

      // Create middle ZIP containing innermost ZIP
      const middle = new AdmZip();
      middle.addFile('innermost.zip', innermost.toBuffer());

      // Create outer ZIP containing middle ZIP
      const outer = new AdmZip();
      outer.addFile('middle.zip', middle.toBuffer());
      outer.writeZip(inputZipPath);

      // Process outer ZIP
      const stats = await processZipFile(inputZipPath, outputZipPath, false);

      // Verify it processed successfully
      expect(stats.errors.length).toBe(0);

      // Verify the nested structure was processed
      const outputZip = new AdmZip(outputZipPath);
      const middleEntry = outputZip.getEntry('middle.zip');
      expect(middleEntry).toBeDefined();

      // Check middle ZIP
      const processedMiddle = new AdmZip(middleEntry.getData());
      const innermostEntry = processedMiddle.getEntry('innermost.zip');
      expect(innermostEntry).toBeDefined();

      // Check innermost ZIP
      const processedInnermost = new AdmZip(innermostEntry.getData());
      const innermostFiles = processedInnermost.getEntries().map(e => e.entryName);
      expect(innermostFiles).toContain('assets/mod/lang/zh_tw.json');
    });

    test('should respect max depth limit for nested ZIPs', async () => {
      // Create a deeply nested ZIP (depth > 10)
      let currentZip = new AdmZip();
      currentZip.addFile('assets/mod/lang/zh_cn.json', Buffer.from('{"test": "测试"}', 'utf8'));

      // Create 15 levels of nesting (exceeds MAX_DEPTH of 10)
      for (let i = 0; i < 15; i++) {
        const nextZip = new AdmZip();
        nextZip.addFile(`level${i}.zip`, currentZip.toBuffer());
        currentZip = nextZip;
      }

      currentZip.writeZip(inputZipPath);

      // Process should complete without infinite recursion
      const stats = await processZipFile(inputZipPath, outputZipPath, false);

      // Should not crash and should complete
      expect(stats).toBeDefined();
    });

    test('should NOT process nested ZIPs when convertNestedZip is false', async () => {
      // Create inner ZIP with Chinese language file
      const innerZip = new AdmZip();
      innerZip.addFile('assets/mod/lang/zh_cn.json', Buffer.from('{"test": "测试"}', 'utf8'));
      const innerZipBuffer = innerZip.toBuffer();

      // Create outer ZIP containing the inner ZIP
      const outerZip = new AdmZip();
      outerZip.addFile('inner.zip', innerZipBuffer);
      outerZip.writeZip(inputZipPath);

      // Process outer ZIP with convertNestedZip = false
      const stats = await processZipFile(inputZipPath, outputZipPath, false, null, 0, false);

      // Verify output ZIP contains unmodified inner.zip
      const outputZip = new AdmZip(outputZipPath);
      const entries = outputZip.getEntries();
      const innerZipEntry = entries.find(e => e.entryName === 'inner.zip');

      expect(innerZipEntry).toBeDefined();

      // The inner ZIP should be identical to the original (not processed)
      const processedInnerZip = new AdmZip(innerZipEntry.getData());
      const innerEntries = processedInnerZip.getEntries();
      const innerFileNames = innerEntries.map(e => e.entryName);

      // Should still have zh_cn but NO zh_tw (because it wasn't processed)
      expect(innerFileNames).toContain('assets/mod/lang/zh_cn.json');
      expect(innerFileNames).not.toContain('assets/mod/lang/zh_tw.json');
    });
  });

  describe('processFolderPath()', () => {
    let testDir;
    let inputDir;
    let outputDir;

    beforeEach(async () => {
      // Create temporary directory for tests
      testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'converter-test-'));
      inputDir = path.join(testDir, 'input');
      outputDir = path.join(testDir, 'output');
      await fs.mkdir(inputDir, { recursive: true });
    });

    afterEach(async () => {
      // Clean up temporary directory
      await fs.rm(testDir, { recursive: true, force: true });
    });

    test('should process folder with zh_cn files', async () => {
      // Create test files
      const langDir = path.join(inputDir, 'assets', 'mod', 'lang');
      await fs.mkdir(langDir, { recursive: true });
      await fs.writeFile(path.join(langDir, 'zh_cn.json'), '{"test": "测试"}', 'utf8');

      // Process folder
      const stats = await processFolderPath(inputDir, outputDir, false);

      // Verify stats
      expect(stats.totalFiles).toBe(1);
      expect(stats.convertedFiles).toBe(1);
      expect(stats.skippedFiles).toBe(0);

      // Verify output files exist
      const zhCnExists = await fs.access(path.join(outputDir, 'assets', 'mod', 'lang', 'zh_cn.json')).then(() => true).catch(() => false);
      const zhTwExists = await fs.access(path.join(outputDir, 'assets', 'mod', 'lang', 'zh_tw.json')).then(() => true).catch(() => false);

      expect(zhCnExists).toBe(true);
      expect(zhTwExists).toBe(true);
    });

    test('should handle en_us files only when convertEnUs is true and no zh_cn exists', async () => {
      // Create test files with only en_us
      const langDir = path.join(inputDir, 'assets', 'mod', 'lang');
      await fs.mkdir(langDir, { recursive: true });
      await fs.writeFile(path.join(langDir, 'en_us.json'), '{"test": "测试"}', 'utf8');

      // Process folder with convertEnUs=true
      const stats = await processFolderPath(inputDir, outputDir, true);

      // Verify stats
      expect(stats.totalFiles).toBe(1);
      expect(stats.convertedFiles).toBe(1);

      // Verify output - en_us should have converted content
      const enUsContent = await fs.readFile(path.join(outputDir, 'assets', 'mod', 'lang', 'en_us.json'), 'utf8');
      expect(enUsContent).toContain('測試'); // Should be converted to traditional Chinese
    });

    test('should NOT convert en_us when zh_cn exists', async () => {
      // Create test files with both zh_cn and en_us
      const langDir = path.join(inputDir, 'assets', 'mod', 'lang');
      await fs.mkdir(langDir, { recursive: true });
      await fs.writeFile(path.join(langDir, 'zh_cn.json'), '{"test": "测试"}', 'utf8');
      await fs.writeFile(path.join(langDir, 'en_us.json'), '{"test": "Hello"}', 'utf8');

      // Process folder with convertEnUs=true
      const stats = await processFolderPath(inputDir, outputDir, true);

      // Verify stats
      expect(stats.totalFiles).toBe(2);
      expect(stats.convertedFiles).toBe(1); // Only zh_cn

      // Verify en_us content is unchanged
      const enUsContent = await fs.readFile(path.join(outputDir, 'assets', 'mod', 'lang', 'en_us.json'), 'utf8');
      expect(enUsContent).toBe('{"test": "Hello"}');
    });
  });
});
