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
import { render, screen } from 'spec/helpers/testing-library';
import {
  ReportHeaderSlotContext,
  useReportHeaderChartControlsSlot,
} from './ReportHeaderSlot';

const SlotProbe = () => {
  const slot = useReportHeaderChartControlsSlot();
  return <span data-test="probe">{slot ? 'slot' : 'none'}</span>;
};

const renderProbe = (sliceIds: number[], slot: HTMLElement | null) =>
  render(
    <ReportHeaderSlotContext.Provider value={{ slot, setSlot: jest.fn() }}>
      <SlotProbe />
    </ReportHeaderSlotContext.Provider>,
    { useRedux: true, initialState: { dashboardState: { sliceIds } } },
  );

test('a single chart dashboard uses the report header slot', () => {
  renderProbe([1], document.createElement('div'));
  expect(screen.getByTestId('probe')).toHaveTextContent('slot');
});

test('a dashboard with more charts keeps the menu in each chart', () => {
  renderProbe([1, 2], document.createElement('div'));
  expect(screen.getByTestId('probe')).toHaveTextContent('none');
});

test('there is no slot before the report header is mounted', () => {
  renderProbe([1], null);
  expect(screen.getByTestId('probe')).toHaveTextContent('none');
});
