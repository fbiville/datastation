const path = require('path');
const { getProjectResultsFile } = require('../store');
const fs = require('fs');
const { LiteralPanelInfo, ProgramPanelInfo } = require('../../shared/state');
const { updateProjectHandler } = require('../store');
const { CODE_ROOT } = require('../constants');
const { makeEvalHandler } = require('./eval');
const { inPath, withSavedPanels } = require('./testutil');

const LANGUAGES = [
  {
    type: 'javascript',
    content:
      'const prev = DM_getPanel(0); const next = prev.map((row) => ({ ...row, "age": +row.age + 10 })); DM_setPanel(next);',
    condition: true,
  },
  {
    type: 'sql',
    content: 'SELECT name, age::INT + 10 AS age FROM DM_getPanel(0)',
    condition: true,
  },
  // Rest are only mandatory-tested on Linux to make CI easier for now
  {
    type: 'python',
    content:
      'prev = DM_getPanel(0)\nnext = [{ **row, "age": int(row["age"]) + 10 } for row in prev]\nDM_setPanel(next)',
    condition: process.platform === 'linux' || inPath('python3'),
  },
  {
    type: 'ruby',
    content:
      'prev = DM_getPanel(0)\npanel = prev.map { |row| { name: row["name"], age: row["age"].to_i + 10 } }\nDM_setPanel(panel)',
    condition: process.platform === 'linux' || inPath('ruby'),
  },
  {
    type: 'julia',
    content:
      'prev = DM_getPanel(0)\nfor row in prev\n  row["age"] = parse(Int64, row["age"]) + 10\nend\nDM_setPanel(prev)',
    condition: process.platform === 'linux' || inPath('julia'),
  },
  {
    type: 'r',
    content:
      'prev = DM_getPanel(0)\nfor (i in 1:length(prev)) {\n  prev[[i]]$age = strtoi(prev[[i]]$age) + 10\n}\nDM_setPanel(prev)',
    condition: process.platform === 'linux' || inPath('Rscript'),
  },
];

for (const t of LANGUAGES) {
  if (!t.condition) {
    continue;
  }

  describe(t.type, () => {
    // First pass runs in process, second pass runs in subprocess
    for (const subprocessName of [
      undefined,
      path.join(CODE_ROOT, 'build', 'desktop_runner.js'),
    ]) {
      test(`runs ${t.type} programs via ${
        subprocessName ? subprocessName : 'process'
      }`, async () => {
        const lp = new LiteralPanelInfo();
        lp.literal.contentTypeInfo = { type: 'text/csv' };
        lp.content = 'age,name\n12,Kev\n18,Nyra';

        const pp = new ProgramPanelInfo();
        pp.program.type = t.type;
        pp.content = t.content;

        let finished = false;
        const panels = [lp, pp];
        await withSavedPanels(
          panels,
          async (project) => {
            const panelValueBuffer = fs.readFileSync(
              getProjectResultsFile(project.projectName) + pp.id
            );
            expect(JSON.parse(panelValueBuffer.toString())).toStrictEqual([
              { name: 'Kev', age: 22 },
              { name: 'Nyra', age: 28 },
            ]);

            finished = true;
          },
          { evalPanels: true, subprocessName }
        );

        if (!finished) {
          throw new Error('Callback did not finish');
        }
      }, 300_000);
    }
  });
}