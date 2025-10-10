# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

from __future__ import annotations

import logging
from typing import Any

import pandas as pd

from superset import app
from superset.common.chart_data import ChartDataResultFormat
from superset.common.query_context_processor import QueryContextProcessor
from superset.translations.utils_custom import get_language_pack_custom
from superset.utils import csv, excel
from superset.utils.core import GenericDataType
from flask_babel import get_locale, gettext as __

config = app.config
logger = logging.getLogger(__name__)


class CustomQueryContextProcessor(QueryContextProcessor):
    """Extended QueryContextProcessor with custom translation support."""

    def get_data(
        self, df: pd.DataFrame, coltypes: list[GenericDataType]
    ) -> str | list[dict[str, Any]]:
        """Override get_data to add custom translation support for CSV/XLSX exports."""

        if self._query_context.result_format in ChartDataResultFormat.table_like():
            include_index = not isinstance(df.index, pd.RangeIndex)
            columns = list(df.columns)
            
            column_names = self._translate_column_names(columns)
            df.columns = column_names

            result = None
            if self._query_context.result_format == ChartDataResultFormat.CSV:
                result = csv.df_to_escaped_csv(
                    df, index=include_index, **config["CSV_EXPORT"]
                )
            elif self._query_context.result_format == ChartDataResultFormat.XLSX:
                excel.apply_column_types(df, coltypes)
                result = excel.df_to_excel(df, **config["EXCEL_EXPORT"])
            return result or ""

        return df.to_dict(orient="records")

    def _translate_column_names(self, columns: list[str]) -> list[str]:
        """Translate column names using verbose_map and custom translations."""

        verbose_map = self._qc_datasource.data.get("verbose_map", {})
        column_names = [verbose_map.get(col, col) for col in columns] if verbose_map else list(columns)
        
        try:
            custom_translations = get_language_pack_custom(get_locale())
            
            if custom_translations:
                translations_dict = self._extract_translations(custom_translations)
                if translations_dict:
                    column_names = [
                        translations_dict.get(name) or translations_dict.get(columns[i], name)
                        for i, name in enumerate(column_names)
                    ]
        except Exception as e:
            logger.warning(f"Failed to apply custom translations: {e}")
        
        return column_names

    def _extract_translations(self, custom_translations: dict[str, Any]) -> dict[str, str]:
        """Extract translations from Jed format or simple dict."""

        if 'locale_data' in custom_translations:
            superset_data = custom_translations.get('locale_data', {}).get('superset', {})
            return {
                key: value[0]
                for key, value in superset_data.items()
                if key and key != '' and isinstance(value, list) and value
            }
        return custom_translations

