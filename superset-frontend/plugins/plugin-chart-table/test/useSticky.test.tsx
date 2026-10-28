/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import '@testing-library/jest-dom';
import { useCallback, useMemo } from 'react';
import { render } from '@superset-ui/core/spec';
import { Column, TableInstance, useTable } from 'react-table';
import useSticky, {
  UseStickyInstanceProps,
} from '../src/DataTable/hooks/useSticky';

type Row = { a: number; b: number };

const ROW_HEIGHT = 20;
const THEAD_HEIGHT = 30;
const ROWS = 50;

function StickyTable({
  height,
  width = 300,
}: {
  height: number;
  width?: number;
}) {
  const columns = useMemo<Column<Row>[]>(
    () => [
      { Header: 'a', accessor: 'a' },
      { Header: 'b', accessor: 'b' },
    ],
    [],
  );
  const data = useMemo(
    () => Array.from({ length: ROWS }, (_, i) => ({ a: i, b: i * 2 })),
    [],
  );
  const getTableSize = useCallback(() => ({ width, height }), [width, height]);
  const instance = useTable<Row>(
    { columns, data, getTableSize } as Parameters<typeof useTable<Row>>[0],
    useSticky,
  ) as TableInstance<Row> & UseStickyInstanceProps;
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    instance;

  return (
    <>
      {instance.wrapStickyTable(() => (
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} key={column.id}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} key={cell.column.id}>
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
    </>
  );
}

let clientHeight: PropertyDescriptor | undefined;
let getBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;

beforeAll(() => {
  clientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight',
  );
  getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (this.tagName === 'THEAD') return THEAD_HEIGHT;
      if (this.tagName === 'TABLE') {
        return (
          THEAD_HEIGHT + this.querySelectorAll('tbody tr').length * ROW_HEIGHT
        );
      }
      return 0;
    },
  });
  HTMLElement.prototype.getBoundingClientRect = function mockRect(
    this: HTMLElement,
  ) {
    return { width: this.tagName === 'TH' ? 100 : 0 } as DOMRect;
  };
});

afterAll(() => {
  if (clientHeight) {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
  }
  HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect;
});

const getScrollBody = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('div[role="presentation"]')].find(
    element =>
      element.style.overflow === 'auto' &&
      element.style.visibility !== 'hidden',
  );

test('measures the table once and resizes the scroll area to a new height without re-rendering the rows', () => {
  const { container, rerender } = render(<StickyTable height={400} />);

  expect(container.querySelectorAll('table')).toHaveLength(2);
  expect(getScrollBody(container)).toHaveStyle({
    height: `${400 - THEAD_HEIGHT}px`,
  });

  const createElement = jest.spyOn(document, 'createElement');
  rerender(<StickyTable height={600} />);

  expect(createElement.mock.calls.filter(([tag]) => tag === 'td')).toHaveLength(
    0,
  );
  expect(container.querySelectorAll('table')).toHaveLength(2);
  expect(getScrollBody(container)).toHaveStyle({
    height: `${600 - THEAD_HEIGHT}px`,
  });
  createElement.mockRestore();
});

test('measures the table again when the width changes', () => {
  const { container, rerender } = render(<StickyTable height={400} />);

  const createElement = jest.spyOn(document, 'createElement');
  rerender(<StickyTable height={400} width={500} />);

  expect(
    createElement.mock.calls.filter(([tag]) => tag === 'td').length,
  ).toBeGreaterThan(0);
  expect(container.querySelectorAll('table')).toHaveLength(2);
  expect(getScrollBody(container)).toHaveStyle({ width: '500px' });
  createElement.mockRestore();
});
