import * as React from 'react';

import { XLSX_MIME_TYPE } from '../shared/text';
import { ContentTypeInfo } from '../shared/state';

import { Select } from './component-library/Select';
import { CodeEditor } from './component-library/CodeEditor';

export function ContentTypePicker({
  value,
  onChange,
  disableAutoDetect,
  inMemoryEval,
}: {
  value: ContentTypeInfo;
  onChange: (v: ContentTypeInfo) => void;
  disableAutoDetect?: boolean;
  inMemoryEval: boolean;
}) {
  return (
    <React.Fragment>
      <div className="form-row">
        <Select
          label="Content Type"
          value={value.type}
          onChange={(type: string) => {
            if (type === 'null') {
              type = '';
            }

            return onChange({ ...value, type });
          }}
        >
          {!disableAutoDetect && <option value="null">Auto-detect</option>}
          <optgroup label="Data">
            <option value="text/csv">CSV</option>
            <option value={XLSX_MIME_TYPE}>Excel</option>
            {inMemoryEval /* This is getting ridiculous. Really need to find a plugin architecture */ && (
              <option value="parquet">Parquet</option>
            )}
            <option value="application/json">JSON</option>
          </optgroup>
          <optgroup label="Logs">
            <option value="text/apache2access">Apache2 Access Logs</option>
            <option value="text/apache2error">Apache2 Error Logs</option>
            <option value="text/nginxaccess">Nginx Access Logs</option>
            <option value="text/syslogrfc3164">Syslog RFC-3164</option>
            <option value="text/syslogrfc5424">Syslog RFC-5424</option>
            <option value="application/jsonlines">
              Newline-delimited JSON
            </option>
            <option value="text/regexplines">Newline-delimited Regex</option>
          </optgroup>
        </Select>
      </div>
      {value.type === 'text/regexplines' && (
        <div className="form-row">
          <CodeEditor
            id=""
            language=""
            value={value.customLineRegexp}
            onChange={(customLineRegexp: string) =>
              onChange({ ...value, customLineRegexp })
            }
          />
          <p>
            Enter a custom ECMAScript-flavor regular expression to be evaluated
            for each line. Only named capture groups will be returned. For
            example:{' '}
            <code>
              {
                '^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) [(?<time>[^]]*)] "(?<method>S+)(?: +(?<path>[^"]*?)(?: +S*)?)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^"]*)" "(?<agent>[^"]*)"(?:s+(?<http_x_forwarded_for>[^ ]+))?)?$'
              }
            </code>
          </p>
        </div>
      )}
    </React.Fragment>
  );
}