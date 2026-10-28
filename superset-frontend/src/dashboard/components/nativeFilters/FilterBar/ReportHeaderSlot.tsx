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
import { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'src/dashboard/types';

// Creare: place in the report header (next to the button that shows/hides the
// filters) where the chart of a single chart dashboard (a report) renders its
// menu (the 3 dots), instead of the chart header with the title. Without a
// provider, or before the report header is mounted, the slot is null.
export interface ReportHeaderSlotState {
  slot: HTMLElement | null;
  setSlot: (slot: HTMLElement | null) => void;
}

export const ReportHeaderSlotContext =
  createContext<ReportHeaderSlotState | null>(null);

export const useReportHeaderSlot = () => useContext(ReportHeaderSlotContext);

/**
 * Element where the chart menu goes, or null when the chart keeps its own
 * header (no report header, or more than one chart in the dashboard).
 */
export const useReportHeaderChartControlsSlot = () => {
  const slot = useReportHeaderSlot()?.slot ?? null;
  const isSingleChart = useSelector<RootState, boolean>(
    state => state.dashboardState?.sliceIds?.length === 1,
  );
  return isSingleChart ? slot : null;
};
