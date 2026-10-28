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
import { Filter, NativeFilterType } from '@superset-ui/core';
import { act, render, screen, userEvent } from 'spec/helpers/testing-library';
import { stateWithoutNativeFilters } from 'spec/fixtures/mockStore';
import { FilterBarOrientation } from 'src/dashboard/types';
import FilterControl from './FilterControl';

jest.mock('./FilterValue', () => ({
  __esModule: true,
  default: () => <div data-test="filter-value" />,
}));

jest.mock('../../state', () => ({
  ...jest.requireActual('../../state'),
  useIsFilterInScope: () => () => true,
}));

const filter = {
  id: 'NATIVE_FILTER-region',
  type: NativeFilterType.NativeFilter,
  name: 'Region',
  description: 'Pick a region',
  filterType: 'filter_select',
  targets: [{ datasetId: 7, column: { name: 'region' } }],
  controlValues: {},
  defaultDataMask: {},
  cascadeParentIds: [],
  scope: { rootPath: ['ROOT_ID'], excluded: [] },
  chartsInScope: [18],
} as unknown as Filter;

test.each([FilterBarOrientation.Horizontal, FilterBarOrientation.Vertical])(
  'hovering the filter title does not open the filter card (%s)',
  async orientation => {
    const { container } = render(
      <FilterControl
        dataMaskSelected={{}}
        filter={filter}
        onFilterSelectionChange={jest.fn()}
        orientation={orientation}
      />,
      { useRedux: true, initialState: stateWithoutNativeFilters },
    );

    expect(screen.getByTestId('filter-control-name')).toHaveTextContent(
      'Region',
    );

    userEvent.hover(screen.getByTestId('filter-control-name'));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    expect(screen.queryByText('Filter type')).not.toBeInTheDocument();
    expect(screen.queryByText('Scope')).not.toBeInTheDocument();
    expect(screen.queryByText('Pick a region')).not.toBeInTheDocument();
    expect(container.querySelector('.anticon-info-circle')).toBeInTheDocument();
  },
);
