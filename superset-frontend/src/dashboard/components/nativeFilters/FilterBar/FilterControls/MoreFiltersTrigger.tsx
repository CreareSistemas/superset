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
import { t } from '@apache-superset/core/translation';
import { styled } from '@apache-superset/core/theme';

// Creare: "More filters" trigger of the horizontal bar as the Design System
// icon button (filter_list icon) with a dot when a hidden filter has a value.
// Colors come from the theme; the dashboard CSS can refine it through
// .more-filters-trigger (aria-expanded="true" while open) and .more-filters-dot.

const Dot = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  width: ${({ theme }) => theme.sizeUnit * 2}px;
  height: ${({ theme }) => theme.sizeUnit * 2}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colorError};
`;

export const MoreFiltersTrigger = ({
  hasActiveFilters,
}: {
  hasActiveFilters: boolean;
}) => (
  <>
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="currentColor"
      role="img"
      aria-label={t('More filters')}
    >
      <path d="M10 18V16H14V18H10ZM6 13V11H18V13H6ZM3 8V6H21V8H3Z" />
    </svg>
    {hasActiveFilters && (
      <Dot className="more-filters-dot" data-test="more-filters-dot" />
    )}
  </>
);
