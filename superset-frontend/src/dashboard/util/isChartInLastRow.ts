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
import { LayoutItem } from 'src/dashboard/types';
import { COLUMN_TYPE, ROW_TYPE } from 'src/dashboard/util/componentTypes';

const isLastChild = (parent: LayoutItem | undefined, childId: string) =>
  !!parent?.children?.length && parent.children.at(-1) === childId;

/**
 * Creare: whether the chart is at the bottom of the dashboard, i.e. in the
 * last row of the grid/tab (and the last chart of its column, if any).
 */
export default function isChartInLastRow(
  component: LayoutItem,
  parentComponent: LayoutItem,
  getComponentById: (id?: string) => LayoutItem | undefined,
) {
  let row: LayoutItem | undefined = parentComponent;
  if (parentComponent.type === COLUMN_TYPE) {
    if (!isLastChild(parentComponent, component.id)) return false;
    row = getComponentById(
      parentComponent.parents?.findLast(parent => parent.startsWith(ROW_TYPE)),
    );
  }
  if (row?.type !== ROW_TYPE) return false;
  return isLastChild(getComponentById(row.parents?.at(-1)), row.id);
}
