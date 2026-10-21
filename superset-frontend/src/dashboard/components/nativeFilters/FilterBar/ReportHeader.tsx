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
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { t } from '@apache-superset/core/translation';
import { css, styled } from '@apache-superset/core/theme';
import { Button, Tooltip } from '@superset-ui/core/components';
import { RootState } from 'src/dashboard/types';
import { DASHBOARD_HEADER_ID } from 'src/dashboard/util/constants';
import { useFilterBarCollapse } from './FilterBarCollapse';

// Creare: report header as in the platform pages (title on the left, the
// button that shows/hides the filters on the right). Base look from the theme;
// the dashboard CSS refines it through the classes below.
const HeaderContainer = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.sizeUnit * 4}px;
    min-height: ${theme.sizeUnit * 14}px;
    margin-bottom: ${theme.sizeUnit * 4}px;
    padding: ${theme.sizeUnit * 3}px;
    border-radius: ${theme.borderRadius}px;
    background: ${theme.colorFillQuaternary};

    .report-header__title {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: ${theme.fontSize}px;
      font-weight: ${theme.fontWeightStrong};
      color: ${theme.colorText};
    }

    /* same toggle of the platform filters: 2 px border on hover (primary)
       and while open (primary at 50%), icon turned upside down when open */
    .report-header__filter-toggle {
      width: ${theme.sizeUnit * 8}px;
      min-width: ${theme.sizeUnit * 8}px;
      height: ${theme.sizeUnit * 8}px;
      padding: 0;
      border: 2px solid transparent;
      border-radius: ${theme.borderRadius}px;
      background: transparent;
      color: ${theme.colorPrimary};

      svg {
        transition: transform 0.3s;
      }
    }

    .report-header__filter-toggle[aria-expanded='true'] {
      border-color: color-mix(in srgb, ${theme.colorPrimary} 50%, transparent);

      svg {
        transform: rotate(180deg);
      }
    }

    && .report-header__filter-toggle:hover {
      border-color: ${theme.colorPrimary};
      background: transparent;
    }
  `}
`;

const ReportHeader = () => {
  const collapse = useFilterBarCollapse();
  const title = useSelector<RootState, string>(
    state =>
      state.dashboardLayout?.present?.[DASHBOARD_HEADER_ID]?.meta?.text ?? '',
  );

  const isOpen = !collapse?.collapsed;
  const toggleLabel = isOpen ? t('Hide filters') : t('Show filters');

  return (
    <HeaderContainer className="report-header" data-test="report-header">
      <h2 className="report-header__title">{t(title)}</h2>
      {collapse && (
        <Tooltip title={toggleLabel}>
          <Button
            buttonStyle="link"
            className="report-header__filter-toggle"
            aria-label={toggleLabel}
            aria-expanded={isOpen}
            data-test="report-header-filter-toggle"
            onClick={() => collapse.setCollapsed(isOpen)}
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
              <path d="M10 18V16H14V18H10ZM6 13V11H18V13H6ZM3 8V6H21V8H3Z" />
            </svg>
          </Button>
        </Tooltip>
      )}
    </HeaderContainer>
  );
};

export default memo(ReportHeader);
