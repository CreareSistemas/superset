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
import configureStore from 'redux-mock-store';
import { render, screen } from 'spec/helpers/testing-library';
import { SpecificRangeFrame } from '../components';

const specificValue = '2021-03-16T00:00:00 : 2021-03-17T00:00:00';
const mockStore = configureStore([thunk]);

test.each([
  ['pt_BR', '16/03/2021 00:00', '17/03/2021 00:00'],
  ['es', '16/03/2021 00:00', '17/03/2021 00:00'],
  ['en', '2021-03-16 00:00', '2021-03-17 00:00'],
])(
  'shows the dates in the %s format, without seconds',
  async (locale, since, until) => {
    render(<SpecificRangeFrame onChange={jest.fn()} value={specificValue} />, {
      store: mockStore({ common: { locale } }),
    });

    expect(await screen.findByDisplayValue(since)).toBeInTheDocument();
    expect(screen.getByDisplayValue(until)).toBeInTheDocument();
  },
);
