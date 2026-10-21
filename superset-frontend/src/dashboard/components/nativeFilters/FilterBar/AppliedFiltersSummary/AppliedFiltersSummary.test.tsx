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
import { NativeFilterType } from '@superset-ui/core';
import { render, screen } from 'spec/helpers/testing-library';
import AppliedFiltersSummary from '.';

const nativeFilter = (id: string, name: string, filterType: string) => ({
  id,
  name,
  filterType,
  type: NativeFilterType.NativeFilter,
  targets: [{ datasetId: 1, column: { name } }],
  controlValues: {},
  defaultDataMask: {},
  cascadeParentIds: [],
  scope: { rootPath: ['ROOT_ID'], excluded: [] },
  chartsInScope: [],
});

const renderSummary = (dataMask: Record<string, unknown>) =>
  render(<AppliedFiltersSummary />, {
    useRedux: true,
    initialState: {
      dashboardInfo: {
        metadata: {
          native_filter_configuration: [
            nativeFilter('NATIVE_FILTER-1', 'Veículos', 'filter_select'),
            nativeFilter('NATIVE_FILTER-2', 'Modelos', 'filter_select'),
            nativeFilter('NATIVE_FILTER-3', 'Período', 'filter_time'),
          ],
        },
      },
      dashboardState: { sliceIds: [] },
      dashboardLayout: { present: {}, past: [], future: [] },
      dataMask,
    },
  });

test('renders nothing without applied filters', () => {
  renderSummary({});
  expect(
    screen.queryByTestId('applied-filters-summary'),
  ).not.toBeInTheDocument();
});

test('shows the number of applied filters, their names and one tag per value', () => {
  renderSummary({
    'NATIVE_FILTER-1': {
      id: 'NATIVE_FILTER-1',
      filterState: { value: ['ABC1234', 'XYZ9876'] },
    },
    'NATIVE_FILTER-2': {
      id: 'NATIVE_FILTER-2',
      filterState: { value: ['Modelo A'] },
    },
    'NATIVE_FILTER-3': {
      id: 'NATIVE_FILTER-3',
      filterState: { value: 'No filter' },
    },
  });

  expect(screen.getByRole('status')).toHaveTextContent(
    '2 filters applied, veículos, modelos',
  );
  expect(screen.getByText('ABC1234')).toHaveAttribute('title', 'Veículos');
  expect(screen.getByText('XYZ9876')).toBeInTheDocument();
  expect(screen.getByText('Modelo A')).toHaveClass(
    'applied-filters-summary__tag--2',
  );
});

test('shows the period as readable dates', () => {
  renderSummary({
    'NATIVE_FILTER-3': {
      id: 'NATIVE_FILTER-3',
      filterState: { value: '2026-10-02T00:00:00 : 2026-10-09T00:00:00' },
    },
  });

  expect(screen.getByRole('status')).toHaveTextContent(
    '1 filter applied, período',
  );
  expect(screen.getByText('2026-10-02 to 2026-10-09')).toBeInTheDocument();
});
