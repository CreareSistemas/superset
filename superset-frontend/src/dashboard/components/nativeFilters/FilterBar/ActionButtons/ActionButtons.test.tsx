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
import { FilterBarOrientation } from 'src/dashboard/types';
import { FilterBarCollapseContext } from '../FilterBarCollapse';
import ActionButtons from './index';

const createProps = () => ({
  onApply: jest.fn(),
  onClearAll: jest.fn(),
  dataMaskSelected: {
    DefaultsID: {
      filterState: {
        value: null,
      },
    },
  },
  dataMaskApplied: {
    DefaultsID: {
      id: 'DefaultsID',
      filterState: {
        value: null,
      },
    },
  },
  isApplyDisabled: false,
});

test('should render the "Apply" button', () => {
  const mockedProps = createProps();
  render(<ActionButtons {...mockedProps} />, { useRedux: true });
  expect(screen.getByText('Apply filters')).toBeInTheDocument();
  expect(screen.getByText('Apply filters').parentElement).toBeEnabled();
});

test('should render the "Clear all" button as disabled', () => {
  const mockedProps = createProps();
  render(<ActionButtons {...mockedProps} />, { useRedux: true });
  const clearBtn = screen.getByText('Clear all');
  expect(clearBtn.parentElement).toBeDisabled();
});

test('should render the "Apply" button as disabled', () => {
  const mockedProps = createProps();
  const applyDisabledProps = {
    ...mockedProps,
    isApplyDisabled: true,
  };
  render(<ActionButtons {...applyDisabledProps} />, { useRedux: true });
  const applyBtn = screen.getByText('Apply filters');
  expect(applyBtn.parentElement).toBeDisabled();
  userEvent.click(applyBtn);
  expect(mockedProps.onApply).not.toHaveBeenCalled();
});

test('should apply', () => {
  const mockedProps = createProps();
  render(<ActionButtons {...mockedProps} />, { useRedux: true });
  const applyBtn = screen.getByText('Apply filters');
  expect(mockedProps.onApply).not.toHaveBeenCalled();
  userEvent.click(applyBtn);
  expect(mockedProps.onApply).toHaveBeenCalled();
});

test('horizontal bar shows "Clear all" before "Search", with stable class names', () => {
  render(
    <ActionButtons
      {...createProps()}
      filterBarOrientation={FilterBarOrientation.Horizontal}
    />,
    { useRedux: true },
  );
  const container = screen.getByTestId('filterbar-action-buttons');
  const clearAll = screen.getByText('Clear all').closest('button');
  const search = screen.getByText('Search').closest('button');

  expect(container).toHaveClass('filter-bar-actions');
  expect(clearAll).toHaveClass('filter-clear-all-button');
  expect(search).toHaveClass('filter-apply-button');
  expect(
    clearAll!.compareDocumentPosition(search!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test('horizontal bar has no "Close" button and "Search" hides the filters', () => {
  const setCollapsed = jest.fn();
  const props = createProps();
  render(
    <FilterBarCollapseContext.Provider
      value={{ collapsed: false, setCollapsed }}
    >
      <ActionButtons
        {...props}
        filterBarOrientation={FilterBarOrientation.Horizontal}
      />
    </FilterBarCollapseContext.Provider>,
    { useRedux: true },
  );

  expect(screen.queryByText('Close')).not.toBeInTheDocument();
  userEvent.click(screen.getByText('Search'));
  expect(props.onApply).toHaveBeenCalled();
  expect(setCollapsed).toHaveBeenLastCalledWith(true);
});

test('horizontal bar "Clear all" is the outlined button', () => {
  const props = createProps();
  render(
    <ActionButtons
      {...props}
      dataMaskSelected={{ DefaultsID: { filterState: { value: 'a' } } }}
      filterBarOrientation={FilterBarOrientation.Horizontal}
    />,
    { useRedux: true },
  );
  const clearAll = screen.getByText('Clear all').closest('button');
  expect(clearAll).toHaveClass('ant-btn-variant-outlined');
  expect(clearAll).toBeEnabled();
  userEvent.click(clearAll!);
  expect(props.onClearAll).toHaveBeenCalled();
});

test('vertical bar has no "Close" button', () => {
  render(
    <FilterBarCollapseContext.Provider
      value={{ collapsed: false, setCollapsed: jest.fn() }}
    >
      <ActionButtons {...createProps()} />
    </FilterBarCollapseContext.Provider>,
    { useRedux: true },
  );
  expect(screen.queryByText('Close')).not.toBeInTheDocument();
});
