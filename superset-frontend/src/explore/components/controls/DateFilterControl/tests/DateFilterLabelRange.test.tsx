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
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from 'spec/helpers/testing-library';
import DateFilterLabel from '..';
import { DateFilterTestKey } from '../utils';

// Creare: the period of the dashboard filter (single calendar)

jest.mock('@superset-ui/core', () => ({
  ...jest.requireActual('@superset-ui/core'),
  fetchTimeRange: jest.fn(() => Promise.resolve({ value: 'evaluated' })),
}));

const mockStore = configureStore([thunk]);

const day = (date: string) =>
  document.querySelector(`[data-date="${date}"]`) as HTMLElement;

test('"Apply" is disabled while only the start of the range is picked', async () => {
  const onChange = jest.fn();
  render(
    <Provider store={mockStore({ common: { locale: 'pt_BR' } })}>
      <DateFilterLabel
        name="time_range"
        specificRangeOnly
        value="2021-03-10T00:00:00 : 2021-03-12T23:59:59"
        onChange={onChange}
      />
    </Provider>,
  );

  userEvent.click(await screen.findByText('10/03/2021 to 12/03/2021'));
  await screen.findByTestId('specific-range-frame');
  const apply = screen.getByTestId(DateFilterTestKey.ApplyButton);
  await waitFor(() => expect(apply).toBeEnabled());
  // the CTAs are not in uppercase
  expect(apply).toHaveTextContent(/^Apply$/);
  expect(screen.getByTestId(DateFilterTestKey.CancelButton)).toHaveTextContent(
    /^Cancel$/,
  );

  userEvent.click(day('2021-03-11'));
  expect(apply).toBeDisabled();

  userEvent.click(day('2021-03-13'));
  await waitFor(() => expect(apply).toBeEnabled());

  userEvent.click(apply);
  expect(onChange).toHaveBeenCalledWith(
    '2021-03-11T00:00:00 : 2021-03-13T23:59:59',
  );
});
