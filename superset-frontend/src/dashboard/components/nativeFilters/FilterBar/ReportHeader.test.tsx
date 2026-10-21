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
import { render, screen, userEvent } from 'spec/helpers/testing-library';
import { FilterBarCollapseContext } from './FilterBarCollapse';
import ReportHeader from './ReportHeader';

const renderHeader = (collapsed: boolean, setCollapsed = jest.fn()) =>
  render(
    <FilterBarCollapseContext.Provider value={{ collapsed, setCollapsed }}>
      <ReportHeader />
    </FilterBarCollapseContext.Provider>,
    {
      useRedux: true,
      initialState: {
        dashboardLayout: {
          present: {
            HEADER_ID: {
              id: 'HEADER_ID',
              type: 'HEADER',
              meta: { text: 'Report title' },
            },
          },
          past: [],
          future: [],
        },
      },
    },
  );

test('shows the report title', () => {
  renderHeader(false);
  expect(screen.getByText('Report title')).toBeInTheDocument();
});

test('the toggle hides the open filters', () => {
  const setCollapsed = jest.fn();
  renderHeader(false, setCollapsed);
  const toggle = screen.getByTestId('report-header-filter-toggle');
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  userEvent.click(toggle);
  expect(setCollapsed).toHaveBeenCalledWith(true);
});

test('the toggle shows the hidden filters', () => {
  const setCollapsed = jest.fn();
  renderHeader(true, setCollapsed);
  const toggle = screen.getByTestId('report-header-filter-toggle');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  userEvent.click(toggle);
  expect(setCollapsed).toHaveBeenCalledWith(false);
});
